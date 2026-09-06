-- Record every sync run, not just its results.
--
-- The panel answered "are we connected to Meta?" with max(synced_at) from
-- meta_ad_daily. That is wrong whenever the sync works perfectly and there is
-- simply nothing to fetch: a correctly configured account with no ads running
-- produces zero rows, so the panel told the founder to go and do the setup he
-- had just finished. Confirmed live on 2026-09-07 — the first successful sync
-- returned ok with rows:0, and the panel would have read that as "not
-- connected".
--
-- "Never ran" and "ran, found nothing" are different facts and have to be
-- stored separately. Same reason cost_per_booking is null rather than zero when
-- there are no bookings.
create table if not exists public.meta_ads_sync_log (
  id            bigserial primary key,
  ran_at        timestamptz not null default now(),
  ok            boolean     not null,
  since         date,
  until         date,
  rows_fetched  integer     not null default 0,
  rows_upserted integer     not null default 0,
  -- Populated only on failure. error_code carries Meta's numeric code where
  -- there is one, so a token expiry (190) is distinguishable from a permission
  -- problem (200) without reading prose.
  error_code    text,
  error_detail  text,
  duration_ms   integer
);

comment on table public.meta_ads_sync_log is
  'One row per meta-ads-sync run. Written by the edge function (service role). Exists so the panel can tell "never connected" from "connected, no ads running" — max(synced_at) on meta_ad_daily cannot, because a healthy sync of an account with no ads writes no rows at all.';

create index if not exists meta_ads_sync_log_ran_at_idx
  on public.meta_ads_sync_log (ran_at desc);

alter table public.meta_ads_sync_log enable row level security;

drop policy if exists meta_ads_sync_log_founder_read on public.meta_ads_sync_log;
create policy meta_ads_sync_log_founder_read on public.meta_ads_sync_log
  for select to authenticated using (public.is_admin_strict());

revoke insert, update, delete on public.meta_ads_sync_log from anon, authenticated;

-- get_meta_ads_performance()'s diagnostics block now reads last_sync_at /
-- last_sync_ok / last_sync_error from here instead of from row timestamps.
-- The full function body lives in 20260906_meta_ads_performance.sql.
