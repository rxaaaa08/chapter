-- Ad volume — how many ads Meta thinks are live, and what it recommends about them.
--
-- WHY THIS EXISTS, WHEN THE AD LIMIT ITSELF DOES NOT APPLY TO US
-- `/act_<ID>/ads_volume` exists to police the per-Page ad limit introduced in
-- 2021 (250 ads at this account's spend tier). That limit is not a real
-- constraint for a business running a handful of ads and it is NOT why this
-- table exists. Two other things in the same response are worth having:
--
--   1. `ads_running_or_in_review_count` counts ads that are IN REVIEW.
--      An ad in review has not spent, so it has no /insights row, so
--      `meta_ad_daily` is structurally blind to it. This is the only cheap way
--      to see an ad exists before it starts costing money — and the gap between
--      "Meta says N ads are live" and "we have spend rows for M of them" is a
--      direct check on whether the sync, or {{ad.id}}, is doing its job.
--
--   2. `recommendations` carries **`learning_limited`** — Meta's own statement
--      that an ad set cannot gather enough conversions to leave the learning
--      phase. That is THE predicted failure mode for this account: measured
--      2026-09-08, weekly purchases run ~6 against Meta's ~50-per-7-days bar,
--      so a campaign optimised for Purchase would sit in learning permanently
--      (see META-ADS-HANDOFF.md §9). We cannot compute this signal ourselves —
--      it is Meta's internal read of its own delivery — and it is the earliest
--      warning that the campaign STRUCTURE is wrong rather than the creative.
--
-- CHANGE-ONLY INSERTS, NOT A HEARTBEAT. The sync writes a row only when
-- something actually differs from the previous snapshot for that actor. A
-- 6-hourly heartbeat would bury the two events anyone cares about — "an ad
-- appeared" and "learning_limited showed up" — in four identical rows a day.
-- `meta_ads_sync_log` already records that a run happened; this records that
-- something CHANGED.

create table if not exists public.meta_ad_volume_snapshots (
  id           uuid primary key default gen_random_uuid(),
  captured_at  timestamptz not null default now(),

  -- The actor is the Facebook Page the limit is enforced against. Meta's docs
  -- say this "is currently always the page ID" — currently doing a lot of work
  -- in that sentence, so it is stored rather than assumed, and it is nullable
  -- because the call without show_breakdown_by_actor returns no actor at all.
  actor_id     text,
  actor_name   text,

  ads_running_or_in_review          integer,
  -- Same count, narrowed to THIS ad account. Differs from the above when a Page
  -- is advertised from more than one account — which is exactly the case where
  -- a limit gets hit for reasons invisible from inside one account.
  account_ads_running_or_in_review  integer,

  limit_on_ads                      integer,
  future_limit                      integer,
  future_limit_activation_date      date,

  -- Raw array: zero_impression | learning_limited | top_campaigns_with_ads_under_cap
  -- | top_adsets_with_ads_under_cap. Stored as given rather than flattened into
  -- booleans, because Meta adds values to this list and a boolean column per
  -- value would silently drop the next one.
  recommendations                   jsonb not null default '[]'::jsonb,

  -- The whole entry, verbatim. Meta's documented field list and Meta's actual
  -- response have disagreed in both directions across this integration (§9), so
  -- anything we failed to model is still captured and can be read back later
  -- without waiting for another change to occur.
  raw                               jsonb
);

create index if not exists meta_ad_volume_snapshots_recent_idx
  on public.meta_ad_volume_snapshots (actor_id, captured_at desc);

comment on table public.meta_ad_volume_snapshots is
  'Change-only log of /act_<ID>/ads_volume. Kept for ads IN REVIEW (invisible to '
  'meta_ad_daily) and for Meta''s learning_limited recommendation, NOT for the '
  'per-Page ad limit, which does not bind at this account''s scale.';

alter table public.meta_ad_volume_snapshots enable row level security;

drop policy if exists meta_ad_volume_snapshots_admin_read on public.meta_ad_volume_snapshots;
create policy meta_ad_volume_snapshots_admin_read on public.meta_ad_volume_snapshots
  for select to authenticated
  using (public.is_admin_strict());
-- No INSERT policy: only meta-ads-sync (service_role, bypasses RLS) writes here.

-- ---------------------------------------------------------------------------
-- The consumer. A table nothing reads is how `last_error` sat invisible for
-- weeks; this is the panel's single call for the whole picture.
-- ---------------------------------------------------------------------------
create or replace function public.get_meta_ad_volume_status()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with latest as (
  select distinct on (actor_id) *
  from public.meta_ad_volume_snapshots
  order by actor_id, captured_at desc
),
-- Ads we have actually seen spend for in the last 7 days. The comparison with
-- Meta's running count is the point of this function.
seen as (
  select count(distinct ad_id) as ads_with_spend
  from public.meta_ad_daily
  where date_start >= current_date - 6
),
-- Ads that sent us at least one TAGGED session in the same window. An ad that
-- is running and spending but appears nowhere here has no {{ad.id}} in its URL
-- parameters — the one failure in this system that cannot be repaired later.
tagged as (
  select count(distinct attribution->>'utm_content') as ads_with_tagged_traffic
  from public.flow_analytics
  where attribution->>'utm_content' ~ '^[0-9]{6,}$'
    and (created_at at time zone 'Asia/Kolkata')::date >= current_date - 6
)
select case when public.is_admin_strict() then jsonb_build_object(
  'captured_at', (select max(captured_at) from latest),
  'actors', coalesce((
    select jsonb_agg(jsonb_build_object(
      'actor_id', actor_id,
      'actor_name', actor_name,
      'running_or_in_review', ads_running_or_in_review,
      'in_this_account', account_ads_running_or_in_review,
      'limit', limit_on_ads,
      'future_limit', future_limit,
      'future_limit_from', future_limit_activation_date,
      'recommendations', recommendations
    ) order by actor_id)
    from latest
  ), '[]'::jsonb),
  'ads_with_spend_7d',        (select ads_with_spend from seen),
  'ads_with_tagged_traffic_7d', (select ads_with_tagged_traffic from tagged),
  -- NULL, not 0, when we have never captured a snapshot. "Meta says zero ads
  -- are running" and "we have never asked Meta" are different answers and only
  -- one of them is about the ads.
  'running_total', (select sum(ads_running_or_in_review) from latest),
  -- WHICH OF TWO CAUSES. untracked_ads is computed from tagged funnel traffic,
  -- and that is empty both when {{ad.id}} is missing from the ads AND when the
  -- client that stamps flow_analytics.attribution has not shipped. Those need
  -- opposite responses — fix the ads, versus deploy our own code — and they are
  -- indistinguishable from the count alone. NULL here means not one funnel row
  -- has ever carried a source, i.e. blame us, not the ads. Same discriminator
  -- get_meta_ad_funnel exposes, for the same reason.
  'capture_live_since', (
    select min(created_at) from public.flow_analytics where attribution is not null
  ),
  -- The finding, stated rather than left to be inferred from three numbers.
  -- Only meaningful once a snapshot exists AND something is running. Read it
  -- together with capture_live_since above: untracked_ads > 0 while that is
  -- NULL is our deploy gap, not a tagging fault on the ads.
  'untracked_ads', (
    select case
      when (select sum(ads_running_or_in_review) from latest) is null then null
      else greatest(
        (select sum(ads_running_or_in_review) from latest)
          - (select ads_with_tagged_traffic from tagged), 0)
    end
  )
) end;
$function$;

comment on function public.get_meta_ad_volume_status() is
  'Latest ad-volume snapshot per actor, plus how many ads we actually saw spend '
  'and tagged traffic from. untracked_ads > 0 while ads run means {{ad.id}} is '
  'missing somewhere. Founder-gated: NULL for anyone not is_admin_strict().';

revoke all on function public.get_meta_ad_volume_status() from public, anon;
grant execute on function public.get_meta_ad_volume_status() to authenticated;
