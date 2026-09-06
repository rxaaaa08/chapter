-- Inbox for Meta ads webhooks.
--
-- WHY A TABLE AND NOT JUST REACTING
-- A webhook tells you something changed; it does not tell you what it changed
-- to. Meta's own guidance is notify -> poll -> act. So the notification is
-- evidence, not the answer, and evidence is worth keeping: when an ad is
-- rejected at 2am we want the record even if whatever we do about it fails.
-- Storing first also lets the endpoint answer Meta in milliseconds, which is
-- what stops Meta retrying and sending the same event again.
--
-- THE FIELD NAMING TRAP
-- Most ad_account webhooks arrive under their own name (creative_fatigue
-- arrives as field='creative_fatigue'). `effective_status` does NOT: you
-- subscribe with that name but Meta delivers it as field='field_changed' with
-- value.changed_fields=['effective_status']. A handler matching
-- field='effective_status' would never fire and would look like Meta simply
-- not sending anything. Hence two columns: `field` is whatever Meta actually
-- said, `changed_fields` is unpacked from the value when present.
create table if not exists public.meta_ads_events (
  id             bigserial primary key,
  received_at    timestamptz not null default now(),
  ad_account_id  text,
  -- Meta's literal changes[].field — 'field_changed', 'creative_fatigue', etc.
  field          text        not null,
  -- Only populated for the field_changed envelope.
  changed_fields text[],
  object_id      text,
  -- 'campaign' | 'adset' | 'ad' — which level of the hierarchy moved.
  object_type    text,
  value          jsonb       not null,
  -- entry.time from Meta, distinct from when we received it.
  entry_time     timestamptz,
  -- The envelope carries NO event id, so there is no natural key to dedup on.
  -- Meta retries anything that does not return 200 quickly, and a retry is
  -- byte-identical, so a hash of (account, field, entry time, value) is the
  -- only thing that can tell a retry from a genuinely repeated change.
  dedup_key      text        not null unique,
  -- Set once we have polled Meta for the detail and done something about it.
  handled_at     timestamptz,
  handled_note   text
);

comment on table public.meta_ads_events is
  'Raw Meta ads webhook notifications. Written by the meta-ads-webhook edge function (service role) after HMAC verification. A notification says something changed, never what it changed to — poll the Graph API for detail, then stamp handled_at.';

create index if not exists meta_ads_events_received_idx on public.meta_ads_events (received_at desc);
create index if not exists meta_ads_events_unhandled_idx on public.meta_ads_events (received_at desc) where handled_at is null;

alter table public.meta_ads_events enable row level security;

drop policy if exists meta_ads_events_founder_read on public.meta_ads_events;
create policy meta_ads_events_founder_read on public.meta_ads_events
  for select to authenticated using (public.is_admin_strict());

revoke insert, update, delete on public.meta_ads_events from anon, authenticated;
