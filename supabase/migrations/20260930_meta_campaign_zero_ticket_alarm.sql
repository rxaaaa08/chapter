-- 2026-09-30, owner: "there could be book now taps after 6x the spend & still
-- 0 sales which is concerning". He is right. After the campaign "no ticket" rule
-- was disabled (20260930_meta_campaign_checkout_tap_cost_alarm.sql), a campaign
-- with CHEAP taps and ZERO tickets fired nothing: the tap rule was satisfied, and
-- cost per ticket had no tickets to divide by. The per-reel Rs.300 rules only
-- catch it if one reel alone spent Rs.300.
--
-- Fix, inside the one ticket rule (cpa_over_ad_budget, campaign): with zero
-- paid tickets, observed = campaign spend and the line = the rule's min_spend
-- (Rs.500). So "Rs.500+ spent, not one ticket" now fires, and with tickets the
-- rule is unchanged (cost per ticket > Rs.100 break-even, from Rs.500).
-- meta-ads-alerts v13 words it "Rs.X spent ... and not one ticket sold".

update public.meta_ad_guardrails
   set notes = notes || ' CHANGED 2026-09-30 (owner): with ZERO tickets it now fires once campaign spend '
               || 'passes min_spend (Rs.500): cheap Book now taps with nobody paying used to fire nothing.',
       updated_at = now()
 where rule_key = 'cpa_over_ad_budget';

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
    min(d.date_start)                       as first_day,
    -- Book now / Contact us taps (the Pixel's InitiateCheckout) Meta credits to
    -- this ad. Meta lists one tap under several names, so the FIRST name present
    -- wins, never a sum: the same rule as PURCHASE_ACTIONS in meta-ads-sync.
    sum(coalesce(
      (select (x->>'value')::numeric from jsonb_array_elements(
         case when jsonb_typeof(d.actions) = 'array' then d.actions else '[]'::jsonb end) x
        where x->>'action_type' = 'offsite_conversion.fb_pixel_initiate_checkout' limit 1),
      (select (x->>'value')::numeric from jsonb_array_elements(
         case when jsonb_typeof(d.actions) = 'array' then d.actions else '[]'::jsonb end) x
        where x->>'action_type' = 'initiate_checkout' limit 1),
      0))                                   as checkout_taps
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
    1 as ads,
    s.checkout_taps
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
    count(*)::int,
    sum(s.checkout_taps)
  from spend s
  join ad_campaign ac on ac.ad_id = s.ad_id
  left join tagged t  on t.ad_id  = s.ad_id
  group by ac.campaign_id
),
unit as (
  select
    u.level, u.unit_id, u.unit_name, u.spend, u.impressions, u.clicks, u.link_clicks,
    u.frequency, u.frequency_source, u.tagged_sessions, u.ads, u.checkout_taps,
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
      -- A CAMPAIGN with spend and zero tickets is the worst case, not an
      -- unknown (owner, 2026-09-30: taps can be cheap while nobody pays, and
      -- then no campaign alarm fired). Observed = the spend, judged against the
      -- rule's own spend floor below; ad-level rules keep the old meaning.
      when 'cost_per_ticket'      then case when r.tickets > 0
                                            then round(r.spend / r.tickets, 2)
                                            when r.level = 'campaign' then r.spend end
      when 'spend_without_ticket' then case when r.tickets = 0 and r.leads > 0
                                            then r.spend end
      when 'spend_without_lead'   then case when r.leads   = 0 then r.spend end
      -- Spend per Book now / Contact tap. With NO taps the observed value is
      -- the whole spend: every rupee bought nothing at the price step, which is
      -- the worst case, not an unknown. The push says "nobody tapped" then.
      when 'cost_per_checkout_tap' then case when r.checkout_taps > 0
                                            then round(r.spend / r.checkout_taps, 2)
                                            else r.spend end
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
      -- Zero tickets: no ticket price to take a percentage of, so the line is
      -- the spend floor itself: fires once the campaign has spent more than it.
      when r.metric = 'cost_per_ticket' and r.level = 'campaign' and r.tickets = 0
        then r.min_spend
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
    'checkout_taps', e.checkout_taps,
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

revoke execute on function public.meta_ad_guardrail_breaches() from public, anon, authenticated;
grant execute on function public.meta_ad_guardrail_breaches() to service_role;
