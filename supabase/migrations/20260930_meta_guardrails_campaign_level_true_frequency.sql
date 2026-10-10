-- 2026-09-30, owner's request ("fix these both"), from the whole-system audit
-- (META-ADS-HANDOFF.md §33.1). Two alarm mechanics did not do what their labels
-- said.
--
-- 1. FREQUENCY READ LOW, BY UP TO 7x. The 7-day frequency was sum(daily
--    impressions) / sum(daily reach). Summed daily reach counts the same person
--    once PER DAY, so an ad showing the same 2,000 people every day for a week
--    read 1.0 instead of 7. Only Meta can de-duplicate people across days, so
--    meta-ads-sync (v30) now also asks for each ad's 7-day totals in one call and
--    stores them in meta_ad_window_reach. The evaluator uses that reading when it
--    covers exactly the evaluator's own window, and otherwise falls back to the
--    old figure, which is a LOWER BOUND (it can only under-alarm, never
--    false-alarm). context.frequency_source says which was used.
--
-- 2. THE MONEY ALARMS JUDGED SINGLE ADS. The plan judges at CAMPAIGN level
--    (FOUNDERS-MEET-ADS-PLAN.md, "When to act"; synthesis #6: ads work as a
--    team). Per ad, with a Rs.500 floor in 7 days, only an ad taking about half of
--    a Rs.150/day budget was ever judged, the campaign total never was, and the
--    cost rule fired from ONE ticket. meta_ad_guardrails gains `level`
--    ('ad' | 'campaign'). The three money rules move to 'campaign' (spend and
--    bookings summed across every ad in the campaign); click-through, frequency
--    and untagged spend stay 'ad', because those judge a creative, not money.
--
--    The cost rule's threshold moves 100 -> 150 (% of what a ticket leaves for
--    ads) with a Rs.1,000 floor: the plan's decision table is "<= Rs.100 raise
--    budget, Rs.100-150 hold, > Rs.150 pause", read at ~Rs.1,000 spent. At 100
--    the phone said "over the limit" inside the hold band. Set it back to 100 to
--    alarm at break-even instead. The rule keeps its key because
--    get_meta_plan_ad_budgets() reads it by name.
--
-- A campaign breach reuses the ad-level output shape: ad_id carries the CAMPAIGN
-- id, ad_name the campaign name, and context.level = 'campaign'. Cooldowns key on
-- (rule_key, ad_id), so they work unchanged. meta-ads-alerts v8 words the push
-- by context.level.
--
-- The function body is the LIVE definition dumped 2026-09-30 (after
-- 20260930_meta_guardrail_link_ctr_and_no_ticket_500.sql), restructured into
-- per-unit rows; never rebuild it from older migration files.

-- ── 1. Meta's own 7-day reach per ad ────────────────────────────────────────
create table if not exists public.meta_ad_window_reach (
  ad_id         text primary key,
  campaign_id   text,
  window_since  date not null,
  window_until  date not null,
  reach         bigint,
  impressions   bigint,
  frequency     numeric,
  synced_at     timestamptz not null default now()
);

comment on table public.meta_ad_window_reach is
  'One row per ad: Meta''s de-duplicated reach and frequency over the guardrail window '
  '(7 days ending today, IST), written by meta-ads-sync. Summing meta_ad_daily.reach '
  'counts a person once per day, so it cannot give this. A row is only used when its '
  'window matches the evaluator''s exactly; an older row is ignored, not trusted. 2026-09-30.';

alter table public.meta_ad_window_reach enable row level security;
drop policy if exists meta_ad_window_reach_founder_read on public.meta_ad_window_reach;
create policy meta_ad_window_reach_founder_read on public.meta_ad_window_reach
  for select using (public.is_admin_strict());
revoke all on public.meta_ad_window_reach from anon, authenticated;
grant select on public.meta_ad_window_reach to authenticated;

-- ── 2. Rules judge an ad or a whole campaign ─────────────────────────────────
alter table public.meta_ad_guardrails
  add column if not exists level text not null default 'ad';
alter table public.meta_ad_guardrails
  drop constraint if exists meta_ad_guardrails_level_check;
alter table public.meta_ad_guardrails
  add constraint meta_ad_guardrails_level_check check (level in ('ad', 'campaign'));

update public.meta_ad_guardrails
   set level = 'campaign',
       threshold = 150,
       min_spend = 1000,
       label = 'Campaign cost per ticket past the pause line',
       notes = notes || ' CHANGED 2026-09-30 (owner, "fix these both"): judged per CAMPAIGN, not per ad, '
               || 'at 150% of the ad money per ticket (Founders Meet: Rs.150, the plan''s pause line; '
               || 'break-even stays Rs.100), from Rs.1,000 of campaign spend (the plan''s read point, '
               || '~10 tickets at target). At 100 it fired inside the plan''s Rs.100-150 hold band, and '
               || 'per ad it fired from one ticket. Set threshold back to 100 to alarm at break-even.',
       updated_at = now()
 where rule_key = 'cpa_over_ad_budget';

update public.meta_ad_guardrails
   set level = 'campaign',
       label = 'Campaign: Rs.500 spent, people started booking, nobody paid',
       notes = notes || ' CHANGED 2026-09-30: judged per CAMPAIGN (every ad summed), not per ad.',
       updated_at = now()
 where rule_key = 'spend_no_ticket_500';

update public.meta_ad_guardrails
   set level = 'campaign',
       label = 'Campaign: Rs.500 spent, not one lead',
       notes = notes || ' CHANGED 2026-09-30: judged per CAMPAIGN (every ad summed), not per ad.',
       updated_at = now()
 where rule_key = 'spend_no_lead_500';

update public.meta_ad_guardrails
   set notes = replace(notes, 'Reads slightly low by construction, so it under-alarms.',
                 'FIXED 2026-09-30: now reads Meta''s own 7-day frequency (meta_ad_window_reach); '
                 || 'it used to divide by summed DAILY reach and read up to 7x low.'),
       updated_at = now()
 where rule_key = 'frequency_over_3';

-- ── 3. The evaluator ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.meta_ad_guardrail_breaches()
 RETURNS TABLE(rule_key text, label text, ad_id text, ad_name text, metric text, observed numeric, threshold numeric, window_days integer, context jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
with
horizon as (
  select coalesce(max(window_days), 7) as days
  from public.meta_ad_guardrails where enabled
),
-- Which campaign every ad belongs to, from any day it ever spent, so a booking
-- still counts for its campaign after the ad itself stopped spending.
ad_campaign as (
  select distinct on (d.ad_id) d.ad_id, d.campaign_id, d.campaign_name
  from public.meta_ad_daily d
  where d.campaign_id is not null
  order by d.ad_id, d.date_start desc
),
spend as (
  select
    d.ad_id,
    max(d.ad_name)                          as ad_name,
    sum(d.spend)::numeric(12,2)             as spend,
    sum(d.impressions)                      as impressions,
    sum(d.clicks)                           as clicks,
    -- Taps through to the site only (Meta's inline_link_clicks). The ctr rule
    -- judges THESE since 2026-09-30; "clicks" above is clicks (all): likes,
    -- profile taps, see-more, which read high and hid dud ads.
    sum(coalesce(d.inline_link_clicks, 0))  as link_clicks,
    -- A LOWER BOUND on the real 7-day frequency: summed daily reach counts one
    -- person once per day. Used only when Meta's own figure is missing.
    case when sum(d.reach) > 0
         then round(sum(d.impressions)::numeric / sum(d.reach), 3) end as frequency_floor,
    min(d.date_start)                       as first_day
  from public.meta_ad_daily d
  where d.date_start >= current_date - ((select days from horizon) - 1)
  group by d.ad_id
),
-- Meta's de-duplicated 7-day frequency, trusted only when it covers exactly the
-- window judged here. A reading from an earlier run is ignored, not reused.
true_reach as (
  select r.ad_id, round(r.frequency, 3) as frequency
  from public.meta_ad_window_reach r
  where r.window_until = current_date
    and r.window_since = current_date - ((select days from horizon) - 1)
    and r.frequency is not null
),
bookings as (
  select
    a.attribution->>'utm_content' as ad_id,
    a.event_slug,
    count(*)                                                          as leads,
    coalesce(sum(greatest(coalesce(a.ticket_count, 1), 1))
      filter (where a.status in ('advance_paid','fully_paid')), 0)     as tickets,
    -- Rs.50 floor, same reasoning as the old percentage rule: live rows exist at
    -- Rs.2 and Rs.3 as deliberate test payments, and a budget derived from those
    -- is a ceiling every real ad breaches instantly.
    sum(greatest(coalesce(a.ticket_count, 1), 1)
        * (bp.at_booking - coalesce(e.cost_per_ticket, 0)))
      filter (where a.status in ('advance_paid','fully_paid') and bp.full_price >= 50)
                                                                      as ad_money,
    sum(greatest(coalesce(a.ticket_count, 1), 1))
      filter (where a.status in ('advance_paid','fully_paid') and bp.full_price >= 50)
                                                                      as ad_money_tickets,
    bool_or(coalesce(e.cost_per_ticket, 0) = 0)
      filter (where a.status in ('advance_paid','fully_paid') and bp.full_price >= 50)
                                                                      as cost_not_set
  from public.applications a
  left join public.events e on e.slug = a.event_slug
  left join lateral public.meta_booking_prices(
         e.payment_mode, e.price_advance, e.price_full,
         e.cities, e.city_details, a.selected_city) bp on true
  where a.attribution->>'utm_content' ~ '^[0-9]{6,}$'
    and (a.created_at at time zone 'Asia/Kolkata')::date
        >= current_date - ((select days from horizon) - 1)
  group by 1, 2
),
tagged as (
  select
    f.attribution->>'utm_content' as ad_id,
    count(distinct f.session_id)  as sessions
  from public.flow_analytics f
  where f.attribution->>'utm_content' ~ '^[0-9]{6,}$'
    and (f.created_at at time zone 'Asia/Kolkata')::date
        >= current_date - ((select days from horizon) - 1)
  group by 1
),
capture_live as (
  select exists (
    select 1 from public.flow_analytics where attribution is not null
  ) as live
),
event_price as (
  select
    e.slug,
    (select max((v->>'price_full')::numeric)
       from jsonb_each(e.city_details) as t(k, v)
      where (v->>'price_full') ~ '^[0-9]+(\.[0-9]+)?$') as price_full
  from public.events e
  where e.city_details is not null
),
-- The unit a rule judges: 'ad' rows exactly as before, plus one 'campaign' row
-- per campaign that spent in the window, summing every ad in it. Bookings are
-- attached by (unit, event) first so each unit can name the plan it mostly sold.
unit_bookings_by_event as (
  select 'ad'::text as level, b.ad_id as unit_id, b.event_slug,
         b.leads, b.tickets, b.ad_money, b.ad_money_tickets, b.cost_not_set
  from bookings b
  union all
  select 'campaign', ac.campaign_id, b.event_slug,
         sum(b.leads), sum(b.tickets), sum(b.ad_money), sum(b.ad_money_tickets), bool_or(b.cost_not_set)
  from bookings b
  join ad_campaign ac on ac.ad_id = b.ad_id
  group by ac.campaign_id, b.event_slug
),
unit_bookings as (
  select
    level, unit_id,
    sum(leads)             as leads,
    sum(tickets)           as tickets,
    sum(ad_money)          as ad_money,
    sum(ad_money_tickets)  as ad_money_tickets,
    bool_or(cost_not_set)  as cost_not_set,
    (array_agg(event_slug order by tickets desc, leads desc, event_slug))[1]
      as dominant_event_slug
  from unit_bookings_by_event
  group by level, unit_id
),
unit_spend as (
  select
    'ad'::text as level, s.ad_id as unit_id, s.ad_name as unit_name,
    s.spend, s.impressions, s.clicks, s.link_clicks,
    coalesce(tr.frequency, s.frequency_floor) as frequency,
    case when tr.frequency is not null then 'meta_7d'
         when s.frequency_floor is not null then 'daily_sum_lower_bound' end as frequency_source,
    coalesce(t.sessions, 0) as tagged_sessions,
    1 as ads
  from spend s
  left join true_reach tr on tr.ad_id = s.ad_id
  left join tagged t      on t.ad_id  = s.ad_id
  union all
  select
    'campaign', ac.campaign_id, max(ac.campaign_name),
    sum(s.spend), sum(s.impressions), sum(s.clicks), sum(s.link_clicks),
    -- No campaign rule judges frequency: people overlap across a campaign's
    -- ads, so summing ads cannot give it, and it is a creative-level signal.
    null::numeric, null::text,
    sum(coalesce(t.sessions, 0)),
    count(*)::int
  from spend s
  join ad_campaign ac on ac.ad_id = s.ad_id
  left join tagged t  on t.ad_id  = s.ad_id
  group by ac.campaign_id
),
unit as (
  select
    u.level, u.unit_id, u.unit_name, u.spend, u.impressions, u.clicks, u.link_clicks,
    u.frequency, u.frequency_source, u.tagged_sessions, u.ads,
    coalesce(b.leads, 0)   as leads,
    coalesce(b.tickets, 0) as tickets,
    b.dominant_event_slug,
    p.price_full,
    case when coalesce(b.ad_money_tickets, 0) > 0
         then round(b.ad_money / b.ad_money_tickets, 2) end as ad_money_per_ticket,
    coalesce(b.cost_not_set, false) as cost_not_set
  from unit_spend u
  left join unit_bookings b on b.level = u.level and b.unit_id = u.unit_id
  left join event_price p   on p.slug  = b.dominant_event_slug
),
candidate as (
  select
    a.*,
    g.rule_key, g.label, g.metric, g.comparator, g.threshold, g.threshold_mode,
    g.min_spend, g.min_impressions, g.min_clicks, g.window_days, g.cooldown_hours,
    row_number() over (
      partition by a.level, a.unit_id, g.metric
      order by (g.scope_event_slug is not null) desc, g.rule_key
    ) as specificity
  from unit a
  join public.meta_ad_guardrails g
    on g.enabled
   and g.level = a.level
   and (g.scope_event_slug is null or g.scope_event_slug = a.dominant_event_slug)
),
resolved as (select * from candidate where specificity = 1),
evaluated as (
  select
    r.*,
    case r.metric
      when 'cost_per_ticket'      then case when r.tickets > 0
                                            then round(r.spend / r.tickets, 2) end
      when 'spend_without_ticket' then case when r.tickets = 0 and r.leads > 0
                                            then r.spend end
      when 'spend_without_lead'   then case when r.leads   = 0 then r.spend end
      when 'frequency'            then r.frequency
      when 'ctr'                  then case when r.impressions > 0
                                            then round(100.0 * r.link_clicks / r.impressions, 3) end
      when 'untagged_spend'       then case when r.tagged_sessions = 0
                                             and (select live from capture_live)
                                            then r.spend end
    end as observed,
    case
      -- A plan that costs more to host than it collects at booking has a
      -- NEGATIVE budget. Clamped to 0 here so the notification reads "vs a Rs.0
      -- ceiling" rather than a negative one, while the real figure travels in
      -- the context for the panel to explain.
      when r.metric = 'cost_per_ticket' and r.threshold_mode = 'pct_of_ad_budget'
        then case when r.ad_money_per_ticket is not null
                  then round(greatest(r.ad_money_per_ticket, 0) * r.threshold / 100.0, 2) end
      when r.metric = 'cost_per_ticket' and r.threshold_mode = 'pct_of_ticket_price'
        then case when r.price_full >= 50
                  then round(r.price_full * r.threshold / 100.0, 2) end
      else r.threshold
    end as effective_threshold
  from resolved r
)
select
  e.rule_key,
  e.label,
  e.unit_id   as ad_id,
  e.unit_name as ad_name,
  e.metric,
  e.observed,
  e.effective_threshold as threshold,
  e.window_days,
  jsonb_build_object(
    'level', e.level,
    'ads', e.ads,
    'spend', e.spend,
    'impressions', e.impressions,
    'clicks', e.clicks,
    'link_clicks', e.link_clicks,
    'leads', e.leads,
    'tickets', e.tickets,
    'tagged_sessions', e.tagged_sessions,
    'frequency_source', e.frequency_source,
    'dominant_event_slug', e.dominant_event_slug,
    'ticket_price', e.price_full,
    'ad_money_per_ticket', e.ad_money_per_ticket,
    'cost_not_set', e.cost_not_set,
    'threshold_mode', e.threshold_mode
  ) as context
from evaluated e
where
  e.observed is not null
  and e.effective_threshold is not null
  and e.spend       >= e.min_spend
  and e.impressions >= e.min_impressions
  and e.clicks      >= e.min_clicks
  and case e.comparator
        when 'gt' then e.observed > e.effective_threshold
        when 'lt' then e.observed < e.effective_threshold
      end
  and not exists (
    select 1 from public.meta_ad_guardrail_events ev
    where ev.rule_key = e.rule_key
      and ev.ad_id    = e.unit_id
      and ev.fired_at > now() - make_interval(hours => e.cooldown_hours)
  )
order by e.spend desc;
$function$;

-- Service role only, exactly as before (§6: this evaluator has one line of
-- defence, the grant). Named `public` too, or the default PUBLIC grant survives.
revoke execute on function public.meta_ad_guardrail_breaches() from public, anon, authenticated;
grant execute on function public.meta_ad_guardrail_breaches() to service_role;
