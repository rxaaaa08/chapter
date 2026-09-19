-- Deleted and archived ads: keep their spend, and prove nothing is missing.
--
-- THE PROBLEM (confirmed 2026-09-17 against Meta's "Manage your ad object's
-- status" reference)
-- meta-ads-sync reads `/act_<ID>/insights?level=ad`. Meta's reference is
-- explicit that this list does NOT include ARCHIVED or DELETED ads unless the
-- query filters on `ad.effective_status`. It also says a deleted ad "may still
-- track impressions, clicks, and actions for 28 days after the date of last
-- delivery". The account-level total, by contrast, aggregates every ad whatever
-- its status.
--
-- What that did to our numbers, before this change:
--   * An ad deleted between two 6-hourly syncs: the spend it ran up after the
--     last sync was never recorded, and its last day stayed frozen part-way.
--   * Conversions Meta kept crediting to it afterwards were never picked up.
--   * Delete a campaign and every ad under it goes the same way.
-- The ads that get deleted are the failing ones, so this understated cost
-- exactly where the truth matters most. The upsert never deletes rows, so
-- already-synced days survived; what went missing was always the tail.
--
-- THE FIX, two halves
--   1. meta-ads-sync asks for every ad status via `filtering` on
--      ad.effective_status (the documented way). If Meta rejects that filter it
--      falls back one step at a time and records which form was used in
--      meta_ads_sync_log.status_filter.
--   2. A safety net that does not depend on the filter being right: the sync
--      also reads Meta's ACCOUNT-level daily spend (what Meta bills, every ad
--      included) into meta_account_daily and compares it, per day, with the
--      sum of our per-ad rows. Any day that differs marks the run NOT ok with
--      error_code 'spend_unaccounted'. That lights the stale-data banner in
--      Growth ▸ Ads and sends one push when a healthy sync turns unhealthy. It
--      catches this cause and any future one: a page silently dropped, a new
--      status nobody listed, a campaign deleted in a way the filter misses.
--
-- WHAT CANNOT BE VERIFIED YET
-- The account has never spent. Meta accepting the filter is checkable today;
-- the filter actually recovering a deleted ad's spend is not, until one exists.
-- The reconciliation is what proves it the first time an ad with spend is
-- deleted: a clean run then means the filter worked, a 'spend_unaccounted' run
-- means it did not.

-- ---------------------------------------------------------------------------
-- 1. What Meta billed per day, account-wide.
-- ---------------------------------------------------------------------------
create table if not exists public.meta_account_daily (
  account_id  text not null,
  date_start  date not null,
  -- Account currency units (rupees), the same unit as meta_ad_daily.spend.
  -- Insights reports spend in currency units; only budgets and bids are paise.
  spend       numeric not null default 0,
  impressions bigint,
  synced_at   timestamptz not null default now(),
  primary key (account_id, date_start)
);

comment on table public.meta_account_daily is
  'Meta account-level daily spend: every ad included, archived and deleted too. '
  'The reference total meta_ad_daily is reconciled against each sync.';

alter table public.meta_account_daily enable row level security;
drop policy if exists meta_account_daily_admin_read on public.meta_account_daily;
create policy meta_account_daily_admin_read on public.meta_account_daily
  for select to authenticated using (public.is_admin_strict());
revoke all on public.meta_account_daily from anon;
revoke insert, update, delete, truncate on public.meta_account_daily from authenticated;

-- ---------------------------------------------------------------------------
-- 2. The sync log remembers which filter was used and what the check found.
-- ---------------------------------------------------------------------------
alter table public.meta_ads_sync_log
  add column if not exists status_filter text,
  add column if not exists spend_check   jsonb;

comment on column public.meta_ads_sync_log.status_filter is
  'Which ad statuses the per-ad insights query asked for: all_statuses (normal), '
  'without_deleted or none (Meta rejected the fuller filter). Anything but '
  'all_statuses means deleted/archived ads may be missing — see spend_check.';
comment on column public.meta_ads_sync_log.spend_check is
  'Per-day comparison of Meta account-level spend with the sum of per-ad rows, '
  'from meta_spend_reconciliation(). {ok:false, error} when the check could not '
  'run, which is reported but never treated as missing spend. NULL on runs that '
  'stopped before reaching it.';

-- ---------------------------------------------------------------------------
-- 3. The comparison. Completed days only.
-- ---------------------------------------------------------------------------
-- Today is left out on purpose. The per-ad and account reads happen seconds
-- apart while today's spend is still moving, and Meta treats the current day as
-- provisional. A deletion today is judged at the first sync after midnight IST.
--
-- Tolerance: a day is a mismatch when the two differ by more than ₹1 AND more
-- than 1% of that day's billed spend. Meta returns spend rounded to the paisa
-- per row, so summing many ad rows can drift by a few paise from the account
-- figure. That is rounding, not missing money, and an alarm that fires on
-- rounding gets ignored.
--
-- Both directions count. Account above per-ad means spend is missing, the case
-- this exists for. Per-ad above account means we hold spend Meta no longer
-- bills, e.g. a restated day for an ad we can no longer re-read.
create or replace function public.meta_spend_reconciliation(
  p_account_id text, p_since date, p_until date, p_today date
) returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  with days as (
    select g::date as d
    from generate_series(p_since, least(p_until, p_today - 1), interval '1 day') g
  ),
  acct as (
    select date_start, spend from public.meta_account_daily
    where account_id = p_account_id and date_start between p_since and p_until
  ),
  ads as (
    select date_start, sum(spend) as spend from public.meta_ad_daily
    where account_id = p_account_id and date_start between p_since and p_until
    group by date_start
  ),
  cmp as (
    select days.d,
           coalesce(acct.spend, 0) as account_spend,
           coalesce(ads.spend, 0)  as ads_spend,
           coalesce(acct.spend, 0) - coalesce(ads.spend, 0) as gap
    from days
    left join acct on acct.date_start = days.d
    left join ads  on ads.date_start  = days.d
  ),
  flagged as (
    select *, abs(gap) > greatest(1, 0.01 * account_spend) as mismatch from cmp
  )
  select jsonb_build_object(
    'days_checked',  count(*),
    'account_spend', round(coalesce(sum(account_spend), 0), 2),
    'ads_spend',     round(coalesce(sum(ads_spend), 0), 2),
    -- Net across mismatched days only, so rounding on healthy days is excluded.
    'unaccounted',   round(coalesce(sum(gap) filter (where mismatch), 0), 2),
    'mismatched_days', coalesce(
      jsonb_agg(jsonb_build_object(
        'date', d, 'account', round(account_spend, 2), 'ads', round(ads_spend, 2), 'gap', round(gap, 2)
      ) order by d) filter (where mismatch),
      '[]'::jsonb)
  )
  from flagged
$$;

-- Called by meta-ads-sync as service_role. The inputs are ad economics, so it
-- is not granted to authenticated; founders read meta_account_daily directly.
revoke all on function public.meta_spend_reconciliation(text, date, date, date) from public, anon, authenticated;
grant execute on function public.meta_spend_reconciliation(text, date, date, date) to service_role;
