-- Ad set configuration, and the one question worth asking of it:
-- can this ad set's optimisation goal ever leave the learning phase?
--
-- WHY THIS EXISTS
-- Meta releases an ad set from the learning phase after roughly 50 optimisation
-- events in 7 days. Below that, delivery stays more expensive and more erratic
-- for the ad set's whole life. Measured 2026-09-08, this business produces about
-- 6 purchases a week site-wide — so an ad set optimising for PURCHASE cannot get
-- there, and the account already contains exactly such an ad set
-- ("Chennai +40km · broad · Purchase", PAUSED). See META-ADS-HANDOFF.md §9 and
-- §10.
--
-- That was found by a human reading the config once. This makes it a standing
-- check, which is the whole point: the next ad set nobody re-reads is the one
-- that quietly burns three months of budget in learning.
--
-- THE TEST IS DELIBERATELY CONSERVATIVE, AND THAT IS WHAT MAKES IT SAFE TO ACT ON.
-- It compares the optimisation event against our SITE-WIDE volume — every
-- visitor, paid and organic. An ad set only ever gets a fraction of that, so
-- site-wide is a hard upper bound. When the check says "impossible" it means:
-- even if this one ad set captured 100% of everything the business produces, it
-- still could not reach 50 a week. That claim needs no assumption about traffic
-- share, cost per event, or budget, which is exactly why it can be trusted.
--
-- Counting DISTINCT SESSIONS, not rows. About 2% of flow_analytics rows repeat a
-- step within a second, and Meta counts events rather than sessions — so this
-- reads slightly LOW and therefore warns slightly early. That is the safe
-- direction for a "you cannot get there" test.

create table if not exists public.meta_adset_config (
  adset_id          text primary key,
  adset_name        text,
  campaign_id       text,
  campaign_name     text,

  -- What Meta is told to optimise for. OFFSITE_CONVERSIONS and VALUE are the
  -- goals that read custom_event_type; the rest are their own targets.
  optimization_goal text,

  -- Extracted from promoted_object, which is a struct. Kept as columns because
  -- these two are the entire question this table exists to answer; `raw` below
  -- keeps everything else.
  pixel_id          text,
  custom_event_type text,

  billing_event     text,
  daily_budget      numeric,
  lifetime_budget   numeric,
  effective_status  text,

  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  -- Moves only when something meaningful differs, so "when did this ad set's
  -- setup last change" is answerable without a full history table.
  config_changed_at timestamptz not null default now(),

  raw               jsonb
);

comment on table public.meta_adset_config is
  'Current ad set setup, synced by meta-ads-sync. Exists to answer whether an ad '
  'set''s optimisation goal can ever exit Meta''s learning phase at this '
  'business''s conversion volume. See META-ADS-HANDOFF.md.';

create index if not exists meta_adset_config_campaign_idx
  on public.meta_adset_config (campaign_id);

alter table public.meta_adset_config enable row level security;

drop policy if exists meta_adset_config_admin_read on public.meta_adset_config;
create policy meta_adset_config_admin_read on public.meta_adset_config
  for select to authenticated
  using (public.is_admin_strict());
-- No INSERT/UPDATE policy: only meta-ads-sync (service_role) writes here.

-- ---------------------------------------------------------------------------
-- The check.
-- ---------------------------------------------------------------------------
-- Ungated core, granted to service_role ONLY — same reasoning as
-- meta_ad_guardrail_breaches(): is_admin_strict() is false for the cron's key,
-- so gating this would hand the sync an empty set forever, silently.
create or replace function public.meta_adset_optimization_warnings()
returns table (
  adset_id          text,
  adset_name        text,
  campaign_name     text,
  optimization_goal text,
  custom_event_type text,
  effective_status  text,
  our_event         text,
  weekly_volume     numeric,
  bar               integer,
  severity          text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
with
-- Meta's learning-phase threshold. One named constant so the arithmetic below
-- reads as a comparison rather than a magic number.
bar as (select 50 as n),

-- Our four-week average weekly volume per funnel step, in DISTINCT SESSIONS.
-- Four weeks rather than one because a single event launch week (55 leads on
-- 10 Aug against a ~15 median) would otherwise declare a goal reachable that
-- normally is not.
steps as (
  select
    f.event_type,
    (count(distinct f.session_id) / 4.0)::numeric as per_week
  from public.flow_analytics f
  where f.created_at >= now() - interval '4 weeks'
  group by f.event_type
),
-- Purchases do NOT come from flow_analytics — they are reported server-side
-- from real payments, so they are counted from the bookings table to match what
-- Meta's pixel actually receives.
purchases as (
  select (count(*) / 4.0)::numeric as per_week
  from public.applications a
  where a.status in ('advance_paid','fully_paid')
    and a.created_at >= now() - interval '4 weeks'
),

-- Meta's custom_event_type -> the browser event we actually fire for it.
-- SOURCE OF TRUTH IS src/supabase.ts PIXEL_EVENTS — if that mapping changes,
-- change this with it or the check silently grades the wrong number.
--   page_view            -> PageView
--   event_selected       -> ViewContent
--   calendar_opened      -> AddToCart
--   book/contact_cta     -> InitiateCheckout
--   application_submitted / details_form_submitted -> Lead
--   (reached_pricing is a CUSTOM event, so it cannot be an optimisation target
--    at all and deliberately has no row here.)
resolved as (
  select
    c.adset_id, c.adset_name, c.campaign_name, c.optimization_goal,
    c.custom_event_type, c.effective_status,
    case
      when c.optimization_goal in ('OFFSITE_CONVERSIONS','VALUE') then
        case c.custom_event_type
          when 'PURCHASE'           then 'Purchase'
          when 'LEAD'               then 'Lead'
          when 'ADD_TO_CART'        then 'AddToCart'
          when 'VIEW_CONTENT'       then 'ViewContent'
          when 'CONTENT_VIEW'       then 'ViewContent'
          when 'INITIATE_CHECKOUT'  then 'InitiateCheckout'
        end
      when c.optimization_goal = 'LANDING_PAGE_VIEWS' then 'PageView'
      -- Every other goal (LINK_CLICKS, REACH, IMPRESSIONS, POST_ENGAGEMENT,
      -- THRUPLAY...) optimises on something Meta counts itself, at volumes far
      -- above the bar. Not our problem, and NULL keeps them out of the result.
    end as our_event
  from public.meta_adset_config c
  -- An archived or deleted ad set cannot spend, so warning about it is noise.
  where coalesce(c.effective_status, '') not in ('DELETED','ARCHIVED')
),
measured as (
  select
    r.*,
    case r.our_event
      when 'Purchase'         then (select per_week from purchases)
      when 'Lead'             then coalesce((select sum(per_week) from steps
                                     where event_type in ('application_submitted','details_form_submitted')), 0)
      when 'AddToCart'        then coalesce((select per_week from steps where event_type = 'calendar_opened'), 0)
      when 'ViewContent'      then coalesce((select per_week from steps where event_type = 'event_selected'), 0)
      when 'InitiateCheckout' then coalesce((select sum(per_week) from steps
                                     where event_type in ('book_cta_clicked','contact_cta_clicked')), 0)
      when 'PageView'         then coalesce((select per_week from steps where event_type = 'page_view'), 0)
    end as weekly_volume
  from resolved r
  where r.our_event is not null
)
select
  m.adset_id, m.adset_name, m.campaign_name, m.optimization_goal,
  m.custom_event_type, m.effective_status, m.our_event,
  round(m.weekly_volume, 1) as weekly_volume,
  (select n from bar) as bar,
  case
    -- Even 100% of site-wide traffic cannot reach the bar. No assumption about
    -- traffic share is needed for this to be true, which is what makes it
    -- worth acting on rather than merely worth noting.
    when m.weekly_volume < (select n from bar) then 'impossible'
    -- Site-wide clears it, but an ad set gets a fraction. 3x the bar is the
    -- rough point past which a realistic share still lands above it.
    when m.weekly_volume < (select n from bar) * 3 then 'tight'
  end as severity
from measured m
where m.weekly_volume is not null
  and m.weekly_volume < (select n from bar) * 3
order by m.weekly_volume asc;
$function$;

comment on function public.meta_adset_optimization_warnings() is
  'Ad sets whose optimisation goal cannot realistically exit Meta''s learning '
  'phase at our conversion volume. Compares against SITE-WIDE volume, which is a '
  'hard upper bound on what one ad set can get. service_role only.';

revoke all on function public.meta_adset_optimization_warnings() from public, anon, authenticated;
grant execute on function public.meta_adset_optimization_warnings() to service_role;

-- Founder-facing wrapper, plus the full config list for a panel view.
create or replace function public.get_meta_adset_health()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case when public.is_admin_strict() then jsonb_build_object(
    'adsets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'adset_id', adset_id,
        'adset_name', adset_name,
        'campaign_name', campaign_name,
        'optimization_goal', optimization_goal,
        'custom_event_type', custom_event_type,
        'billing_event', billing_event,
        'daily_budget', daily_budget,
        'effective_status', effective_status,
        'config_changed_at', config_changed_at
      ) order by campaign_name, adset_name)
      from public.meta_adset_config
    ), '[]'::jsonb),
    'warnings', coalesce((
      select jsonb_agg(to_jsonb(w) order by w.weekly_volume)
      from public.meta_adset_optimization_warnings() w
    ), '[]'::jsonb),
    -- NULL, not 0, when no ad set has ever been synced: "no ad sets exist" and
    -- "we have never looked" are different answers.
    'synced_adsets', (select count(*) from public.meta_adset_config),
    'last_seen_at',  (select max(last_seen_at) from public.meta_adset_config)
  ) end;
$function$;

comment on function public.get_meta_adset_health() is
  'Founder-gated: ad set config plus any optimisation goals that cannot exit the '
  'learning phase. NULL for anyone who is not is_admin_strict().';

revoke all on function public.get_meta_adset_health() from public, anon;
grant execute on function public.get_meta_adset_health() to authenticated;
