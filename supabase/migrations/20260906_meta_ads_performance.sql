-- Meta ads performance: our own spend-vs-revenue reporting.
--
-- WHY THIS EXISTS
-- Ads Manager already shows cost per result, so copying it would be pointless.
-- The thing Ads Manager structurally CANNOT do is join Meta's spend to our
-- money. Meta books a Purchase worth the full ticket the moment someone pays a
-- ₹102 advance, but only ~80% of advances ever become fully_paid — so Meta's
-- ROAS is systematically optimistic and no setting fixes it. It is counting
-- intent; this table lets us count cash.
--
-- Two halves, joined on the Meta ad id:
--   1. meta_ad_daily   — spend/impressions/clicks per ad per day, synced from
--                        the Marketing API by the meta-ads-sync edge function.
--   2. applications.attribution — already live since 2026-08-13 (src/attribution.ts).
--
-- THE JOIN CONTRACT: every ad's "URL parameters" field in Ads Manager must be
--   utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.id}}&utm_content={{ad.id}}
-- Meta substitutes the real ids at click time, and attribution.ts already
-- captures utm_content/utm_term verbatim. So attribution->>'utm_content' IS the
-- ad id, with no code change anywhere in the client.
--
-- This contract can only break silently — someone edits an ad and drops the
-- parameters, and the panel quietly shows zero bookings against real spend. So
-- get_meta_ads_performance() returns an explicit `diagnostics` block naming
-- unmatched spend and unmatched bookings. Drift shows up as a number, not as
-- an absence.

-- ── 1. The spend side ───────────────────────────────────────────────────────
create table if not exists public.meta_ad_daily (
  ad_id              text        not null,
  date_start         date        not null,
  account_id         text        not null,
  ad_name            text,
  adset_id           text,
  adset_name         text,
  campaign_id        text,
  campaign_name      text,
  effective_status   text,
  currency           text        not null default 'INR',
  spend              numeric(12,2) not null default 0,
  impressions        bigint      not null default 0,
  clicks             bigint      not null default 0,
  inline_link_clicks bigint      not null default 0,
  reach              bigint      not null default 0,
  frequency          numeric(8,3),
  -- Meta's OWN attributed conversions, kept deliberately alongside ours. The
  -- gap between meta_purchases and our fully_paid count is the whole point of
  -- this table; storing both is what makes that gap visible instead of a
  -- matter of opinion.
  meta_leads         integer     not null default 0,
  meta_purchases     integer     not null default 0,
  meta_purchase_value numeric(12,2) not null default 0,
  synced_at          timestamptz not null default now(),
  primary key (ad_id, date_start)
);

comment on table public.meta_ad_daily is
  'One row per Meta ad per day. Written only by the meta-ads-sync edge function (service role). Rows are UPSERTed on every sync because Meta restates a day''s spend and conversions for up to ~7 days after it closes — never assume a synced day is final.';

create index if not exists meta_ad_daily_date_idx     on public.meta_ad_daily (date_start desc);
create index if not exists meta_ad_daily_campaign_idx on public.meta_ad_daily (campaign_id, date_start desc);

alter table public.meta_ad_daily enable row level security;

-- Founders only. Same exposure class as get_analytics_summary: this is
-- business-wide spend data, and staff logins must not reach it through the
-- REST API just because the UI happens to be admin-only.
drop policy if exists meta_ad_daily_founder_read on public.meta_ad_daily;
create policy meta_ad_daily_founder_read on public.meta_ad_daily
  for select to authenticated using (public.is_admin_strict());

-- No INSERT/UPDATE/DELETE policy at all: the sync function uses the service
-- role, which bypasses RLS. Nothing else may write here.
revoke insert, update, delete on public.meta_ad_daily from anon, authenticated;

-- ── 2. The join key, indexed ────────────────────────────────────────────────
-- attribution->>'utm_content' is read on every panel load; without this the
-- RPC sequential-scans applications for each ad.
create index if not exists applications_attr_ad_id_idx
  on public.applications ((attribution->>'utm_content'))
  where attribution is not null;

create index if not exists applications_attr_source_idx
  on public.applications ((attribution->>'utm_source'))
  where attribution is not null;

-- ── 3. The report ───────────────────────────────────────────────────────────
-- Founder-gated like get_analytics_summary / get_performance_summary: SECURITY
-- DEFINER, granted to `authenticated`, returns NULL for anyone who is not a
-- strict admin. Never expose meta_ad_daily through a direct client select.
create or replace function public.get_meta_ads_performance(
  p_since date default (current_date - 29),
  p_until date default current_date
) returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with
-- Bookings carrying a Meta ad id, dated to the LANDING day rather than the
-- booking day. This is the one thing that makes a daily cost-per-acquisition
-- honest: spend happens when the click happens, but the ticket may be paid
-- three days later. Bucketing by landed_at puts cost and outcome in the same
-- column. attribution.landed_at has been captured since 2026-08-13; rows older
-- than that fall back to created_at.
attributed as (
  select
    a.event_slug,
    a.phone,
    a.status,
    -- One booking can be several heads on pay-at-venue open events. Counting
    -- rows only would report a four-ticket sale as one acquisition and make
    -- that ad's cost read four times worse than it was.
    greatest(coalesce(a.ticket_count, 1), 1) as tickets,
    a.attribution->>'utm_content' as ad_id,
    (coalesce(nullif(a.attribution->>'landed_at','')::timestamptz, a.created_at)
       at time zone 'Asia/Kolkata')::date as touch_date
  from public.applications a
  where a.attribution ? 'utm_content'
    -- {{ad.id}} always expands to digits. Organic tags like 'link_in_bio' are
    -- real attribution but not ad ids, so they must not join to spend.
    and a.attribution->>'utm_content' ~ '^[0-9]{6,}$'
),
-- Cash actually received, not ticket price. A split booking that paid only the
-- advance contributes the advance — this is the number Meta cannot know.
cash as (
  select p.event_slug, p.phone, sum(p.amount) as received
  from public.payu_payments p
  where p.status = 'success'
  group by 1, 2
),
booked as (
  select
    t.ad_id,
    t.touch_date,
    count(*)                                                          as leads,
    count(*) filter (where t.status in ('advance_paid','fully_paid'))  as bookings,
    count(*) filter (where t.status = 'fully_paid')                    as completed,
    coalesce(sum(t.tickets) filter (where t.status in ('advance_paid','fully_paid')), 0) as tickets,
    coalesce(sum(c.received), 0)::numeric(12,2)                        as revenue
  from attributed t
  left join cash c on c.event_slug = t.event_slug and c.phone = t.phone
  where t.touch_date between p_since and p_until
  group by 1, 2
),
spend as (
  select * from public.meta_ad_daily
  where date_start between p_since and p_until
),
-- Per ad, over the whole window.
per_ad as (
  select
    coalesce(s.ad_id, b.ad_id)                       as ad_id,
    max(s.ad_name)                                   as ad_name,
    max(s.adset_name)                                as adset_name,
    max(s.campaign_name)                             as campaign_name,
    coalesce(sum(s.spend), 0)::numeric(12,2)         as spend,
    coalesce(sum(s.impressions), 0)                  as impressions,
    coalesce(sum(s.inline_link_clicks), 0)           as link_clicks,
    coalesce(sum(s.meta_purchases), 0)               as meta_purchases,
    coalesce(sum(s.meta_purchase_value), 0)::numeric(12,2) as meta_purchase_value,
    coalesce(sum(b.leads), 0)                        as our_leads,
    coalesce(sum(b.bookings), 0)                     as our_bookings,
    coalesce(sum(b.completed), 0)                    as our_completed,
    coalesce(sum(b.tickets), 0)                      as our_tickets,
    coalesce(sum(b.revenue), 0)::numeric(12,2)       as our_revenue
  from spend s
  full outer join booked b
    on b.ad_id = s.ad_id and b.touch_date = s.date_start
  group by 1
),
-- Per day, across all ads — this is what the cost-per-acquisition graph plots.
per_day as (
  select
    coalesce(s.date_start, b.touch_date)             as day,
    coalesce(sum(s.spend), 0)::numeric(12,2)         as spend,
    coalesce(sum(b.leads), 0)                        as leads,
    coalesce(sum(b.bookings), 0)                     as bookings,
    coalesce(sum(b.completed), 0)                    as completed,
    coalesce(sum(b.tickets), 0)                      as tickets,
    coalesce(sum(b.revenue), 0)::numeric(12,2)       as revenue
  from spend s
  full outer join booked b
    on b.ad_id = s.ad_id and b.touch_date = s.date_start
  group by 1
)
select case when public.is_admin_strict() then jsonb_build_object(
  'since', p_since,
  'until', p_until,
  'per_ad', coalesce((
    select jsonb_agg(jsonb_build_object(
      'ad_id', ad_id,
      'ad_name', ad_name,
      'adset_name', adset_name,
      'campaign_name', campaign_name,
      'spend', spend,
      'impressions', impressions,
      'link_clicks', link_clicks,
      'meta_purchases', meta_purchases,
      'meta_purchase_value', meta_purchase_value,
      'our_leads', our_leads,
      'our_bookings', our_bookings,
      'our_completed', our_completed,
      'our_tickets', our_tickets,
      'our_revenue', our_revenue,
      -- Nulls, not zeros: "no data yet" and "free" are different answers and a
      -- chart must not draw a line through the first one.
      'cost_per_lead',    case when our_leads     > 0 then round(spend / our_leads, 2) end,
      'cost_per_booking', case when our_bookings  > 0 then round(spend / our_bookings, 2) end,
      'cost_per_ticket',  case when our_tickets   > 0 then round(spend / our_tickets, 2) end,
      'cost_per_customer',case when our_completed > 0 then round(spend / our_completed, 2) end,
      'true_roas',        case when spend > 0 then round(our_revenue / spend, 2) end,
      -- What Meta believes, for the same ad, over the same window.
      'meta_roas',        case when spend > 0 then round(meta_purchase_value / spend, 2) end
    ) order by spend desc, our_revenue desc)
    from per_ad
  ), '[]'::jsonb),
  'daily', coalesce((
    select jsonb_agg(jsonb_build_object(
      'day', day,
      'spend', spend,
      'leads', leads,
      'bookings', bookings,
      'completed', completed,
      'tickets', tickets,
      'revenue', revenue,
      'cost_per_booking', case when bookings > 0 then round(spend / bookings, 2) end,
      'cost_per_ticket',  case when tickets  > 0 then round(spend / tickets, 2) end
    ) order by day)
    from per_day where day is not null
  ), '[]'::jsonb),
  'totals', (
    select jsonb_build_object(
      'spend', coalesce(sum(spend), 0),
      'leads', coalesce(sum(leads), 0),
      'bookings', coalesce(sum(bookings), 0),
      'completed', coalesce(sum(completed), 0),
      'tickets', coalesce(sum(tickets), 0),
      'revenue', coalesce(sum(revenue), 0),
      'cost_per_booking', case when coalesce(sum(bookings),0) > 0
                               then round(sum(spend) / sum(bookings), 2) end,
      'cost_per_ticket', case when coalesce(sum(tickets),0) > 0
                              then round(sum(spend) / sum(tickets), 2) end,
      'true_roas', case when coalesce(sum(spend),0) > 0
                        then round(sum(revenue) / sum(spend), 2) end
    ) from per_day
  ),
  -- The join contract breaks silently. These make it break loudly instead.
  'diagnostics', jsonb_build_object(
    -- Ads that cost money and produced no booking we can see. Early on this is
    -- normal; sustained, it means the URL parameters are missing on that ad.
    'spend_with_no_bookings', coalesce((
      select round(sum(spend), 2) from per_ad where spend > 0 and our_leads = 0
    ), 0),
    'ads_with_spend', (select count(*) from per_ad where spend > 0),
    -- Visitors who arrived tagged as Meta traffic but carried no ad id. If this
    -- is non-zero while ads are running, the {{ad.id}} macro is not set.
    'meta_visits_without_ad_id', (
      select count(*) from public.applications a
      where a.attribution->>'utm_source' = 'meta'
        and coalesce(a.attribution->>'utm_content','') !~ '^[0-9]{6,}$'
        and (a.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
    ),
    -- Bookings we matched to an ad id that has no spend row yet: the sync has
    -- not run, or has not caught up with a brand-new ad.
    'bookings_with_no_spend_row', coalesce((
      select sum(our_leads) from per_ad where spend = 0 and our_leads > 0
    ), 0),
    'last_synced_at', (select max(synced_at) from public.meta_ad_daily)
  )
) end;
$function$;

revoke all on function public.get_meta_ads_performance(date, date) from public, anon;
grant execute on function public.get_meta_ads_performance(date, date) to authenticated;

comment on function public.get_meta_ads_performance(date, date) is
  'Founder-gated Meta ad performance: Meta spend joined to OUR bookings and OUR cash. Bookings are bucketed by attribution.landed_at (the click day), not the payment day, so daily cost-per-acquisition compares like with like. Returns NULL for non-founders.';
