-- Unified customer analytics, phase 2 of 8: evidence.
--
-- Design:    docs/UNIFIED-CUSTOMER-ANALYTICS-PROPOSAL-v2-2026-10-11.md §7
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md
--
-- "Who does a visit belong to" is never stored as a conclusion. What is stored
-- is each thing that was OBSERVED, and the reading rules (phase 3) decide what
-- it adds up to. So the rules can be made stricter or looser later without
-- having lost anything, and a wrong rule never corrupts the record.
--
-- Most evidence already has a home and is read from there, not copied:
--   a number typed for a code, a code entered correctly, a chat-reply link used
--   to skip the code            → open_event_otp_sessions (+ its new session_id)
--   an application sent         → applications (+ its new first_session_id)
-- Only evidence with no home of its own is stored in the new table:
--   a link from one of our messages was opened in this visit
--   an /invite address or a receipt lookup named a number in this visit
--
-- Nothing calls any of this yet. No row is written until the site starts
-- sending its visit id (phase 7), which needs a push and so the owner's OK.

-- ── 1. The table ─────────────────────────────────────────────────────────────
create table if not exists analytics.identity_evidence (
  id           bigint generated always as identity primary key,
  session_id   text        not null,
  visitor_id   text,
  phone        text        not null check (phone ~ '^[6-9][0-9]{9}$'),
  kind         text        not null check (kind in ('message_link_opened', 'invite_address', 'receipt_lookup')),
  -- Where the proof lives. For a message link this is the whatsapp_sends row.
  -- NEVER the link code itself: that code can stand in for a booking code for
  -- 14 days (open-event-otp, chat_verify) and is a secret.
  ref_table    text,
  ref_id       text,
  observed_at  timestamptz not null default now(),
  -- A line is never edited or deleted to correct it. It is withdrawn, with the
  -- reason, so last month's reading can still be explained.
  withdrawn_at  timestamptz,
  withdrawn_why text
);

comment on table analytics.identity_evidence is
  'One line per thing OBSERVED that ties a website visit to a phone number, for the kinds of evidence that have no table of their own. A line is a fact about what happened, never a conclusion about who the visitor is, and it grants nothing. Read through analytics.v_identity_evidence, which adds the evidence held in open_event_otp_sessions and applications.';

-- One visit opening the same message's link twice is one fact.
create unique index if not exists identity_evidence_once_key
  on analytics.identity_evidence (session_id, kind, phone, coalesce(ref_table, ''), coalesce(ref_id, ''));
create index if not exists identity_evidence_phone_idx
  on analytics.identity_evidence (phone, observed_at);
create index if not exists identity_evidence_visitor_idx
  on analytics.identity_evidence (visitor_id)
  where visitor_id is not null;

-- Guarded twice, like app_secrets: the schema is unreachable AND the table has
-- deny-all RLS and no client grants. Either alone would do; both means one
-- mistake is not enough.
alter table analytics.identity_evidence enable row level security;
revoke all on analytics.identity_evidence from public, anon, authenticated;

-- ── 2. Every kind of evidence, in one place ──────────────────────────────────
--
-- strength is how much the line proves, NOT a score to add up:
--   3  a code we sent to that phone was read and entered in this visit
--   2  this visit holds a link we sent to that number (a forwarded message
--      carries it, so it does not prove who is holding it)
--   1  someone typed that number here (it may be wrong, or someone else's)
--   0  the address named that number (anyone can type an address)
create or replace view analytics.v_identity_evidence
with (security_invoker = true) as
select 'stored:' || e.id                as evidence_id,
       e.session_id, e.visitor_id, e.phone, e.kind,
       case e.kind when 'message_link_opened' then 2 when 'receipt_lookup' then 1 else 0 end as strength,
       e.ref_table, e.ref_id, e.observed_at
from analytics.identity_evidence e
where e.withdrawn_at is null
union all
select 'otp_typed:' || o.id, o.session_id, o.visitor_id, o.phone, 'number_typed', 1,
       'open_event_otp_sessions', o.id::text, o.created_at
from public.open_event_otp_sessions o
where o.session_id ~ '^[0-9a-fA-F-]{16,64}$'
union all
select 'otp_verified:' || o.id, o.session_id, o.visitor_id, o.phone,
       case when o.verified_via = 'chat_link' then 'chat_link_used' else 'code_verified' end,
       case when o.verified_via = 'chat_link' then 2 else 3 end,
       'open_event_otp_sessions', o.id::text, o.verified_at
from public.open_event_otp_sessions o
where o.session_id ~ '^[0-9a-fA-F-]{16,64}$'
  and o.verified_at is not null
union all
select 'application:' || a.id, a.first_session_id, a.first_visitor_id, a.phone, 'application_sent', 1,
       'applications', a.id::text, a.created_at
from public.applications a
where a.first_session_id ~ '^[0-9a-fA-F-]{16,64}$';

revoke all on analytics.v_identity_evidence from public, anon, authenticated;

-- ── 3. Writers ───────────────────────────────────────────────────────────────

-- Called by the public site when a page opens with a message link's code, with
-- the visit and browser it opened in.
--
-- WHY A NEW FUNCTION and not more arguments on log_whatsapp_click(): that one
-- stamps a message's FIRST tap and returns early on every later one, by design,
-- and People ▸ Call draws its "clicked" mark from it. This one has a different
-- job: a line on EVERY arrival, which is also what counts how many people come
-- back through a saved link on day 2, 3 or 7. Keeping them apart means the tap
-- mark cannot be broken by this, and the two can be changed separately.
--
-- WHY ANON MAY CALL IT: the same argument as log_whatsapp_click. The code is
-- the proof; holding it means holding that message. All a caller can do is
-- record "a visit holding this link exists", which is exactly what the line
-- claims and no more. It returns nothing either way, so it cannot be used to
-- test whether a code exists.
create or replace function public.log_link_arrival(
  p_token      text,
  p_session_id text,
  p_visitor_id text default null
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_code  text;
  v_send  bigint;
  v_phone text;
  v_n     integer;
begin
  if p_token is null or length(p_token) > 64 then return; end if;
  v_code := split_part(p_token, '.', 1);
  if v_code !~ '^[A-Za-z0-9_-]{12,40}$' then return; end if;
  if p_session_id is null or p_session_id !~ '^[0-9a-fA-F-]{16,64}$' then return; end if;
  if p_visitor_id is not null and p_visitor_id !~ '^[0-9a-fA-F-]{16,64}$' then
    p_visitor_id := null;
  end if;

  select s.id, public.wa_normalise_phone(s.to_phone)
    into v_send, v_phone
  from public.whatsapp_sends s
  where s.click_token = v_code
  limit 1;
  if v_send is null or v_phone is null or v_phone !~ '^[6-9][0-9]{9}$' then return; end if;

  -- A leaked code must not become a way to fill the table.
  select count(*) into v_n
  from analytics.identity_evidence e
  where e.ref_table = 'whatsapp_sends' and e.ref_id = v_send::text;
  if v_n >= 200 then return; end if;

  insert into analytics.identity_evidence (session_id, visitor_id, phone, kind, ref_table, ref_id)
  values (p_session_id, p_visitor_id, v_phone, 'message_link_opened', 'whatsapp_sends', v_send::text)
  on conflict do nothing;
exception when others then
  -- A lost line costs one mark in a report. It must never surface to a guest.
  return;
end;
$fn$;

-- Naming PUBLIC matters: revoking from anon/authenticated alone leaves the
-- default PUBLIC grant in place and changes nothing.
revoke all on function public.log_link_arrival(text, text, text) from public, anon, authenticated;
grant execute on function public.log_link_arrival(text, text, text) to anon, authenticated;

-- For the server only (edge functions, with the service key): a lookup that
-- named a number in this visit. Not callable from a browser, because unlike a
-- link code there is no proof in the arguments themselves.
create or replace function public.note_identity_evidence(
  p_session_id text,
  p_visitor_id text,
  p_phone      text,
  p_kind       text,
  p_ref_table  text default null,
  p_ref_id     text default null
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_phone text := public.wa_normalise_phone(p_phone);
begin
  if p_kind is null or p_kind not in ('invite_address', 'receipt_lookup') then return; end if;
  if p_session_id is null or p_session_id !~ '^[0-9a-fA-F-]{16,64}$' then return; end if;
  if v_phone is null or v_phone !~ '^[6-9][0-9]{9}$' then return; end if;
  if p_visitor_id is not null and p_visitor_id !~ '^[0-9a-fA-F-]{16,64}$' then
    p_visitor_id := null;
  end if;

  insert into analytics.identity_evidence (session_id, visitor_id, phone, kind, ref_table, ref_id)
  values (p_session_id, p_visitor_id, v_phone, p_kind, left(p_ref_table, 60), left(p_ref_id, 80))
  on conflict do nothing;
exception when others then
  return;
end;
$fn$;

revoke all on function public.note_identity_evidence(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.note_identity_evidence(text, text, text, text, text, text) to service_role;

-- ── 4. Delete-by-phone reaches all of it ─────────────────────────────────────
--
-- Proposal §5.2: this must be true BEFORE the first line is written.
--
-- Deleting the evidence lines is not enough. A booking-code row now carries the
-- visit it was asked in, so as long as that row survives, the visit is still
-- tied to the number. purge_phone_data never cleared open_event_otp_sessions
-- (the "build-test phones the purger does not clean" noted in the analytics
-- memory), so it is cleared here. Booking rows take their own visit ids with
-- them, as they are already deleted.
--
-- Once these are gone, that person's website steps are anonymous rows again:
-- flow_analytics itself holds no number.
create or replace function analytics.purge_contact(p_phones text[])
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_evidence integer;
  v_codes    integer;
begin
  delete from analytics.identity_evidence e where e.phone = any (p_phones);
  get diagnostics v_evidence = row_count;
  delete from public.open_event_otp_sessions o where o.phone = any (p_phones);
  get diagnostics v_codes = row_count;
  return jsonb_build_object('identity_evidence', v_evidence, 'open_event_otp_sessions', v_codes);
end;
$fn$;

create or replace function analytics.scan_contact(p_phones text[])
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  select jsonb_build_object(
    'identity_evidence',       (select count(*) from analytics.identity_evidence e where e.phone = any (p_phones)),
    'open_event_otp_sessions', (select count(*) from public.open_event_otp_sessions o where o.phone = any (p_phones))
  );
$fn$;

-- What a purge does NOT remove, so that nobody has to discover it. Reported
-- beside the scan, never added to its total. Whether these should also be
-- cleared is the owner's decision; nothing here changes it.
create or replace function analytics.scan_kept_after_purge(p_phones text[])
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  select jsonb_build_object(
    'whatsapp_sends',     (select count(*) from public.whatsapp_sends s    where public.wa_normalise_phone(s.to_phone)   = any (p_phones)),
    'whatsapp_inbound',   (select count(*) from public.whatsapp_inbound i  where public.wa_normalise_phone(i.from_phone) = any (p_phones)),
    'application_events', (select count(*) from public.application_events h where public.wa_normalise_phone(h.phone)     = any (p_phones))
  );
$fn$;

revoke all on function analytics.purge_contact(text[])         from public, anon, authenticated;
revoke all on function analytics.scan_contact(text[])          from public, anon, authenticated;
revoke all on function analytics.scan_kept_after_purge(text[]) from public, anon, authenticated;

-- Wire them into the two existing functions by inserting one call each, rather
-- than restating 100 lines of someone else's function here and risking a stale
-- copy overwriting a newer live one (the migrations folder is behind the live
-- database). Each edit is checked: if the anchor is not found, the migration
-- fails loudly instead of leaving the purge silently incomplete.
do $do$
declare
  d  text;
  d2 text;
begin
  select pg_get_functiondef('public.purge_phone_data(text[], text)'::regprocedure) into d;
  if position('analytics.purge_contact' in d) = 0 then
    d2 := regexp_replace(
      d,
      'FOREACH\s+d\s+IN\s+ARRAY\s+v_days\s+LOOP',
      E'v_counts := v_counts || analytics.purge_contact(v_valid);\n  FOREACH d IN ARRAY v_days LOOP'
    );
    if d2 = d then
      raise exception 'purge_phone_data: anchor not found, analytics purge NOT wired in';
    end if;
    execute d2;
  end if;

  select pg_get_functiondef('public.scan_phone_data(text[])'::regprocedure) into d;
  if position('analytics.scan_contact' in d) = 0 then
    d2 := regexp_replace(
      d,
      '''other_counts'',\s*jsonb_build_object\(',
      '''kept_after_purge'', analytics.scan_kept_after_purge(v_valid), ''other_counts'', analytics.scan_contact(v_valid) || jsonb_build_object('
    );
    if d2 = d then
      raise exception 'scan_phone_data: anchor not found, analytics scan NOT wired in';
    end if;
    execute d2;
  end if;
end;
$do$;
