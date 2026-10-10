-- 2026-09-30, owner's request. Two alarm changes, applied together.
--
-- 1. The click-through alarm judged Meta's "clicks (all)" (likes, profile taps,
--    see-more) at a 0.5% floor and only after 10 clicks, so an ad almost nobody
--    tapped through to the site could never trigger it. It now judges LINK
--    clicks (taps through to the site) against a 1% floor, the events benchmark
--    in the owner's lesson synthesis (Willington: link CTR > 1%), after 1,000
--    impressions with no minimum clicks. The metric keeps its name 'ctr' so
--    meta-ads-alerts ("X% click-through, under the Y% floor") needs no redeploy.
-- 2. "Leads but no ticket" fired only after Rs.1,000 (10x the Rs.100 ad money
--    per Founders Meet ticket). Lowered to Rs.500 (5x), the careful end of the
--    lessons' 3-5x "spend before judging" rule, matching the other money alarms.
--
-- The function body is the LIVE definition dumped 2026-09-30 with four edits
-- (link_clicks summed, carried through the ad CTE, used by 'ctr', added to context);
-- never rebuild it from older migration files, which are behind the live DB.

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
    case when sum(d.reach) > 0
         then round(sum(d.impressions)::numeric / sum(d.reach), 3) end as frequency,
    min(d.date_start)                       as first_day
  from public.meta_ad_daily d
  where d.date_start >= current_date - ((select days from horizon) - 1)
  group by d.ad_id
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
per_ad_bookings as (
  select
    ad_id,
    sum(leads)             as leads,
    sum(tickets)           as tickets,
    sum(ad_money)          as ad_money,
    sum(ad_money_tickets)  as ad_money_tickets,
    bool_or(cost_not_set)  as cost_not_set,
    (array_agg(event_slug order by tickets desc, leads desc, event_slug))[1]
      as dominant_event_slug
  from bookings
  group by ad_id
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
ad as (
  select
    s.ad_id, s.ad_name, s.spend, s.impressions, s.clicks, s.link_clicks, s.frequency,
    coalesce(b.leads, 0)   as leads,
    coalesce(b.tickets, 0) as tickets,
    b.dominant_event_slug,
    coalesce(t.sessions, 0) as tagged_sessions,
    p.price_full,
    case when coalesce(b.ad_money_tickets, 0) > 0
         then round(b.ad_money / b.ad_money_tickets, 2) end as ad_money_per_ticket,
    coalesce(b.cost_not_set, false) as cost_not_set
  from spend s
  left join per_ad_bookings b on b.ad_id = s.ad_id
  left join tagged t          on t.ad_id = s.ad_id
  left join event_price p     on p.slug  = b.dominant_event_slug
),
candidate as (
  select
    a.*,
    g.rule_key, g.label, g.metric, g.comparator, g.threshold, g.threshold_mode,
    g.min_spend, g.min_impressions, g.min_clicks, g.window_days, g.cooldown_hours,
    row_number() over (
      partition by a.ad_id, g.metric
      order by (g.scope_event_slug is not null) desc, g.rule_key
    ) as specificity
  from ad a
  join public.meta_ad_guardrails g
    on g.enabled
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
  e.ad_id,
  e.ad_name,
  e.metric,
  e.observed,
  e.effective_threshold as threshold,
  e.window_days,
  jsonb_build_object(
    'spend', e.spend,
    'impressions', e.impressions,
    'clicks', e.clicks,
    'link_clicks', e.link_clicks,
    'leads', e.leads,
    'tickets', e.tickets,
    'tagged_sessions', e.tagged_sessions,
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
      and ev.ad_id    = e.ad_id
      and ev.fired_at > now() - make_interval(hours => e.cooldown_hours)
  )
order by e.spend desc;
$function$;

update public.meta_ad_guardrails
set rule_key = 'link_ctr_under_1pct',
    label = 'Under 1% of viewers tap through to the site',
    threshold = 1,
    min_impressions = 1000,
    min_clicks = 0,
    min_spend = 0,
    notes = 'Link click-through (taps to the site / impressions), not clicks (all). Floor 1% = events benchmark (Willington); Mark''s 3% is US e-commerce. From 1,000 impressions with no click minimum, so an ad nobody taps IS caught (the old 10-click floor silenced exactly those). Was ctr_under_half_pct (all clicks, 0.5%, 2,000 impressions, 10 clicks) until 2026-09-30.',
    updated_at = now()
where rule_key = 'ctr_under_half_pct';

update public.meta_ad_guardrails
set rule_key = 'spend_no_ticket_500',
    label = 'Rs.500 spent, people started booking, nobody paid',
    threshold = 500,
    min_spend = 500,
    notes = notes || ' CHANGED 2026-09-30 (owner): Rs.1,000 -> Rs.500, i.e. 5x the Rs.100 ad money per ticket, the careful end of the lessons'' 3-5x rule. Was rule_key spend_no_ticket_1000.',
    updated_at = now()
where rule_key = 'spend_no_ticket_1000';
