-- Email delivery log — the mirror of whatsapp_sends.
--
-- Before this, email tracking was nine one-off columns spread across
-- applications and bill_opens: no message id, no delivered state, and a new
-- column for every new email. Brevo events were matched back by email address
-- plus "which column is still null", which is why nothing could render both
-- channels with one component.
--
-- Two jobs in one table:
--   1. the delivery record (sent -> delivered -> opened -> clicked, or failed)
--   2. the SEND GUARD that stops the same email going twice
--
-- The guard matters more than it looks. The columns this replaces are not
-- records, they are claims: payment_failed_email_sent is flipped false->true in
-- a conditional UPDATE *before* the send, so a PayU callback and webhook landing
-- together cannot both email. A log row written *after* a send cannot do that
-- job. So the claim moves into this table as an INSERT under a unique index --
-- the insert IS the claim, and the index provides the atomicity.

create table if not exists public.email_sends (
  id                bigint generated always as identity primary key,
  provider          text not null default 'brevo',
  message_id        text,
  to_email          text not null,
  -- The UI label, not the Brevo tag and not the subject line: verification_code,
  -- nudge, retry, payment_success, details, invite. What the admin panel groups by.
  kind              text not null,
  subject           text,
  application_id    uuid references public.applications(id) on delete set null,
  -- Cart-abandonment nudges are keyed to a bill open, not an application: the
  -- same person can abandon the same event twice and should be nudged twice.
  bill_open_id      uuid references public.bill_opens(id) on delete set null,
  sent_at           timestamptz,
  delivered_at      timestamptz,
  opened_at         timestamptz,
  clicked_at        timestamptz,
  failed_at         timestamptz,
  error_code        text,
  error_message     text,
  send_ok           boolean,
  send_http_status  integer,
  raw_send          jsonb,
  sent_by_email     text,
  -- Rows reconstructed from the legacy columns rather than observed as they
  -- happened. Same honesty rule as field='baseline' in application_events: a
  -- backfilled row has no message_id and can never receive a late callback.
  backfilled        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Brevo's message id is how every later event finds its row.
create unique index if not exists email_sends_message_id_key
  on public.email_sends (message_id) where message_id is not null;

-- ── The send guards ─────────────────────────────────────────────────────────
-- Deliberately an explicit kind list rather than "all kinds". A new email type
-- gets no dedup until it is added here, which fails toward sending rather than
-- toward silently blocking a customer's mail.
--
-- verification_code is NOT here on purpose: OTP resends are legitimate (rate
-- limited to 2 per 10 minutes elsewhere), so claiming them would break the
-- open-event booking gate.
create unique index if not exists email_sends_once_per_application
  on public.email_sends (application_id, kind)
  where application_id is not null and kind in ('invite', 'details', 'retry');

create unique index if not exists email_sends_once_per_bill_open
  on public.email_sends (bill_open_id, kind)
  where bill_open_id is not null and kind = 'nudge';

create index if not exists email_sends_to_email_idx on public.email_sends (lower(to_email));
create index if not exists email_sends_application_idx on public.email_sends (application_id);
create index if not exists email_sends_created_idx on public.email_sends (created_at desc);

-- Raw callback payloads, kept separately so a shape we do not understand yet is
-- never lost. Mirrors whatsapp_send_events.
create table if not exists public.email_send_events (
  id          bigint generated always as identity primary key,
  provider    text not null default 'brevo',
  message_id  text,
  event       text,
  to_email    text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists email_send_events_message_idx on public.email_send_events (message_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Read: founders only. Write: nobody through the API -- every write goes through
-- the secret-guarded SECURITY DEFINER functions below, so a leaked anon key
-- cannot forge a delivery record.
alter table public.email_sends       enable row level security;
alter table public.email_send_events enable row level security;

drop policy if exists email_sends_admin_read on public.email_sends;
create policy email_sends_admin_read on public.email_sends
  for select using (public.is_admin_strict());

drop policy if exists email_send_events_admin_read on public.email_send_events;
create policy email_send_events_admin_read on public.email_send_events
  for select using (public.is_admin_strict());

-- TRUNCATE bypasses RLS entirely, so revoking it is not optional.
revoke insert, update, delete, truncate on public.email_sends       from anon, authenticated;
revoke insert, update, delete, truncate on public.email_send_events from anon, authenticated;
grant select on public.email_sends       to anon, authenticated;
grant select on public.email_send_events to anon, authenticated;

-- ── Claim ───────────────────────────────────────────────────────────────────
-- Returns the new row's id, or NULL when another caller already claimed this
-- send. NULL means "do not send" -- it is not an error.
--
-- Reuses whatsapp_log_secret rather than minting a second secret: the same six
-- edge functions send both channels and already carry WHATSAPP_LOG_SECRET. A
-- new secret would have to be set on each of them by hand, and the failure mode
-- of getting that wrong is logging silently switching itself off.
create or replace function public.claim_email_send(
  p_secret         text,
  p_kind           text,
  p_to_email       text,
  p_application_id uuid default null,
  p_bill_open_id   uuid default null,
  p_subject        text default null,
  p_sent_by        text default null
) returns bigint
language plpgsql security definer set search_path to 'public'
as $$
declare v_id bigint;
begin
  if p_secret is null or p_secret is distinct from
     (select value from public.app_secrets where name = 'whatsapp_log_secret') then
    raise exception 'unauthorized';
  end if;
  if p_to_email is null or btrim(p_to_email) = '' or p_kind is null then
    raise exception 'kind and to_email are required';
  end if;

  insert into public.email_sends (
    provider, to_email, kind, subject, application_id, bill_open_id, sent_by_email
  ) values (
    'brevo', btrim(p_to_email), btrim(p_kind), p_subject, p_application_id, p_bill_open_id, p_sent_by
  )
  on conflict do nothing
  returning id into v_id;

  return v_id;   -- null when the unique index refused it
end; $$;

-- ── Record the send ─────────────────────────────────────────────────────────
create or replace function public.log_email_send(
  p_secret      text,
  p_id          bigint,
  p_message_id  text default null,
  p_ok          boolean default null,
  p_http_status integer default null,
  p_raw         jsonb default null
) returns void
language plpgsql security definer set search_path to 'public'
as $$
begin
  if p_secret is null or p_secret is distinct from
     (select value from public.app_secrets where name = 'whatsapp_log_secret') then
    raise exception 'unauthorized';
  end if;

  update public.email_sends
     set message_id       = coalesce(p_message_id, message_id),
         sent_at          = coalesce(sent_at, now()),
         send_ok          = coalesce(p_ok, send_ok),
         send_http_status = coalesce(p_http_status, send_http_status),
         raw_send         = coalesce(p_raw, raw_send),
         updated_at       = now()
   where id = p_id;
end; $$;

-- ── Release a claim ─────────────────────────────────────────────────────────
-- Only ever removes a row that never went out. The sent_at guard means a bug in
-- a caller's error handling can never delete a real delivery record.
create or replace function public.release_email_send(
  p_secret text,
  p_id     bigint
) returns void
language plpgsql security definer set search_path to 'public'
as $$
begin
  if p_secret is null or p_secret is distinct from
     (select value from public.app_secrets where name = 'whatsapp_log_secret') then
    raise exception 'unauthorized';
  end if;

  delete from public.email_sends where id = p_id and sent_at is null;
end; $$;

-- ── Brevo callbacks ─────────────────────────────────────────────────────────
-- Forward-only by construction: every timestamp is written through COALESCE, so
-- a duplicate or out-of-order callback can never walk a row backwards. That is
-- the same class of bug PAID_RANK guards against in payu-callback, where an old
-- advance callback arriving after the balance once un-paid a customer.
--
-- A click sets clicked_at whether or not an open was ever recorded: image-blocked
-- clients fire a click with no open, and gating on opened_at would silently
-- downgrade the strongest signal email gives us.
create or replace function public.log_email_status(
  p_secret        text,
  p_message_id    text,
  p_event         text,
  p_occurred_at   timestamptz default null,
  p_email         text default null,
  p_error_code    text default null,
  p_error_message text default null,
  p_provider      text default 'brevo',
  p_raw           jsonb default null
) returns void
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_ts    timestamptz := coalesce(p_occurred_at, now());
  v_event text := lower(btrim(coalesce(p_event, '')));
begin
  if p_secret is null or p_secret is distinct from
     (select value from public.app_secrets where name = 'whatsapp_log_secret') then
    raise exception 'unauthorized';
  end if;

  insert into public.email_send_events (provider, message_id, event, to_email, payload)
  values (coalesce(p_provider, 'brevo'), p_message_id, v_event, p_email, p_raw);

  if p_message_id is null then return; end if;

  update public.email_sends
     set delivered_at =
         -- 'request' is NOT delivery: Brevo emits it when it accepts the send,
         -- which is the accepted rung, and sent_at already covers that. Mapping
         -- it here let it win the COALESCE over the real `delivered` event two
         -- seconds later, so a mail Brevo accepted but never delivered would have
         -- shown double grey ticks. Found by a live test send on 2026-09-01.
           case when v_event = 'delivered'
                then coalesce(delivered_at, v_ts) else delivered_at end,
         opened_at =
           case when v_event in ('opened', 'unique_opened', 'unique_proxy_open', 'unique_open', 'proxy_open')
                then coalesce(opened_at, v_ts) else opened_at end,
         clicked_at =
           case when v_event in ('click', 'clicked')
                then coalesce(clicked_at, v_ts) else clicked_at end,
         failed_at =
           case when v_event in ('hard_bounce', 'soft_bounce', 'blocked', 'spam', 'invalid_email', 'deferred', 'error')
                then coalesce(failed_at, v_ts) else failed_at end,
         -- delivered_at is deliberately NOT inferred from an open or a click.
         -- It would have to be stamped with the open's timestamp, which is not
         -- when delivery happened. The UI resolver already reads the highest
         -- state reached, so an opened row never displays as merely accepted.
         error_code    = coalesce(p_error_code, error_code),
         error_message = coalesce(p_error_message, error_message),
         updated_at    = now()
   where message_id = p_message_id;
end; $$;

grant execute on function public.claim_email_send(text, text, text, uuid, uuid, text, text)      to anon, authenticated, service_role;
grant execute on function public.log_email_send(text, bigint, text, boolean, integer, jsonb)     to anon, authenticated, service_role;
grant execute on function public.release_email_send(text, bigint)                                 to anon, authenticated, service_role;
grant execute on function public.log_email_status(text, text, text, timestamptz, text, text, text, text, jsonb) to anon, authenticated, service_role;
