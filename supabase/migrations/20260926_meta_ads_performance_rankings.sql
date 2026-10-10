-- Show the ad quality rankings Meta already gives us (cloud audit OPP-6, 2026-09-26)
-- =============================================================================
-- meta-ads-sync has requested quality_ranking, engagement_rate_ranking and
-- conversion_rate_ranking and written them to meta_ad_daily every day, but no
-- report or panel ever read them. They are the one "why" signal that separates
-- a creative problem from a price or targeting problem:
--   quality below average    → the ad itself looks low-quality next to rivals
--   engagement below average → people scroll past it
--   conversion below average → people engage but do not act (page / price)
-- Additive: four new keys per ad; nothing else changes. Built on the LIVE
-- definition dumped 2026-09-26 (the migrations folder is behind the live DB).
-- Every value reads NULL until the first ad spends; the page says "not graded
-- yet" rather than showing blanks. Meta does not document when it starts
-- grading, so the page does not promise a date.

CREATE OR REPLACE FUNCTION public.get_meta_ads_performance(p_since date DEFAULT (CURRENT_DATE - 29), p_until date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
with
rules as (
  select 10::integer as judge_min_tickets
),
attributed as (
  select
    a.event_slug,
    a.phone,
    a.status,
    greatest(coalesce(a.ticket_count, 1), 1) as tickets,
    a.attribution->>'utm_content' as ad_id,
    (coalesce(nullif(a.attribution->>'landed_at','')::timestamptz, a.created_at)
       at time zone 'Asia/Kolkata')::date as touch_date
  from public.applications a
  where a.attribution ? 'utm_content'
    and a.attribution->>'utm_content' ~ '^[0-9]{6,}$'
),
payments as (
  select
    p.event_slug,
    p.phone,
    p.amount as paid,
    f.ticket_amount,
    f.fee_amount,
    f.fee_rate,
    f.method
  from public.payu_payments p
  cross join lateral public.payu_fee_split(p.amount, p.payu_response->>'mode') f
  where p.status = 'success'
),
cash as (
  select
    event_slug,
    phone,
    sum(paid)                                                  as paid,
    sum(coalesce(ticket_amount, paid))                         as received,
    coalesce(sum(fee_amount), 0)                               as fees,
    count(*) filter (where ticket_amount is null)              as fee_unknown_payments,
    coalesce(sum(paid) filter (where ticket_amount is null), 0) as fee_unknown_amount
  from payments
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
    coalesce(sum(c.received), 0)::numeric(12,2)                        as revenue,
    coalesce(sum(c.fees), 0)::numeric(12,2)                            as fees,
    coalesce(sum(c.paid), 0)::numeric(12,2)                            as paid,
    coalesce(sum(c.fee_unknown_payments), 0)                           as fee_unknown_payments,
    coalesce(sum(c.fee_unknown_amount), 0)::numeric(12,2)              as fee_unknown_amount
  from attributed t
  left join cash c on c.event_slug = t.event_slug and c.phone = t.phone
  where t.touch_date between p_since and p_until
  group by 1, 2
),
method_mix as (
  select
    coalesce(pm.method, 'unknown')                            as method,
    pm.fee_rate,
    count(*)                                                  as payments,
    sum(pm.paid)::numeric(12,2)                               as paid,
    sum(coalesce(pm.ticket_amount, pm.paid))::numeric(12,2)   as ticket_money,
    coalesce(sum(pm.fee_amount), 0)::numeric(12,2)            as fees
  from attributed t
  join payments pm on pm.event_slug = t.event_slug and pm.phone = t.phone
  where t.touch_date between p_since and p_until
  group by 1, 2
),
spend as (
  select * from public.meta_ad_daily
  where date_start between p_since and p_until
),
-- Meta's three grades per ad (cloud audit OPP-6, 2026-09-26). Fetched and stored
-- by meta-ads-sync every day since 2026-09-07 but never read by anything. The
-- LATEST day in the window that carries a real grade: Meta answers UNKNOWN until
-- an ad has enough impressions, and an ungraded later day must not blank out a
-- grade an earlier day already had. NULL = never graded in this window.
grades as (
  select distinct on (ad_id)
         ad_id, date_start as graded_on,
         quality_ranking, engagement_rate_ranking, conversion_rate_ranking
  from public.meta_ad_daily
  where date_start between p_since and p_until
    and coalesce(nullif(quality_ranking, 'UNKNOWN'),
                 nullif(engagement_rate_ranking, 'UNKNOWN'),
                 nullif(conversion_rate_ranking, 'UNKNOWN')) is not null
  order by ad_id, date_start desc
),
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
    coalesce(sum(b.revenue), 0)::numeric(12,2)       as our_revenue,
    coalesce(sum(b.fees), 0)::numeric(12,2)          as our_fees,
    coalesce(sum(b.paid), 0)::numeric(12,2)          as our_paid
  from spend s
  full outer join booked b
    on b.ad_id = s.ad_id and b.touch_date = s.date_start
  group by 1
),
per_day as (
  select
    coalesce(s.date_start, b.touch_date)             as day,
    coalesce(sum(s.spend), 0)::numeric(12,2)         as spend,
    coalesce(sum(b.leads), 0)                        as leads,
    coalesce(sum(b.bookings), 0)                     as bookings,
    coalesce(sum(b.completed), 0)                    as completed,
    coalesce(sum(b.tickets), 0)                      as tickets,
    coalesce(sum(b.revenue), 0)::numeric(12,2)       as revenue,
    coalesce(sum(b.fees), 0)::numeric(12,2)          as fees,
    coalesce(sum(b.paid), 0)::numeric(12,2)          as paid,
    coalesce(sum(b.fee_unknown_payments), 0)         as fee_unknown_payments,
    coalesce(sum(b.fee_unknown_amount), 0)::numeric(12,2) as fee_unknown_amount
  from spend s
  full outer join booked b
    on b.ad_id = s.ad_id and b.touch_date = s.date_start
  group by 1
),
tot as (
  select
    coalesce(sum(spend), 0)   as spend,
    coalesce(sum(tickets), 0) as tickets,
    coalesce(sum(revenue), 0) as revenue
  from per_day
),
tot_ci as (
  select ci.low, ci.high
  from tot cross join lateral public.poisson_ci95(tot.tickets::numeric) ci
)
select case when public.is_admin_strict() then jsonb_build_object(
  'since', p_since,
  'until', p_until,
  'judge_min_tickets', (select judge_min_tickets from rules),
  'per_ad', coalesce((
    select jsonb_agg(jsonb_build_object(
      'ad_id', pa.ad_id,
      'ad_name', pa.ad_name,
      'adset_name', pa.adset_name,
      'campaign_name', pa.campaign_name,
      'spend', pa.spend,
      'impressions', pa.impressions,
      'link_clicks', pa.link_clicks,
      'meta_purchases', pa.meta_purchases,
      'meta_purchase_value', pa.meta_purchase_value,
      'our_leads', pa.our_leads,
      'our_bookings', pa.our_bookings,
      'our_completed', pa.our_completed,
      'our_tickets', pa.our_tickets,
      'our_revenue', pa.our_revenue,
      'our_fees', pa.our_fees,
      'our_paid', pa.our_paid,
      'cost_per_lead',    case when pa.our_leads     > 0 then round(pa.spend / pa.our_leads, 2) end,
      'cost_per_booking', case when pa.our_bookings  > 0 then round(pa.spend / pa.our_bookings, 2) end,
      'cost_per_ticket',  case when pa.our_tickets   > 0 then round(pa.spend / pa.our_tickets, 2) end,
      'cost_per_customer',case when pa.our_completed > 0 then round(pa.spend / pa.our_completed, 2) end,
      'true_roas',        case when pa.spend > 0 then round(pa.our_revenue / pa.spend, 2) end,
      'meta_roas',        case when pa.spend > 0 then round(pa.meta_purchase_value / pa.spend, 2) end,
      'enough_to_judge',  pa.our_tickets >= (select judge_min_tickets from rules),
      'cost_per_ticket_low',  case when pa.our_tickets > 0 and ci.high > 0 then round(pa.spend / ci.high, 2) end,
      'cost_per_ticket_high', case when pa.our_tickets > 0 and ci.low  > 0 then round(pa.spend / ci.low, 2) end,
      'true_roas_low',  case when pa.spend > 0 and pa.our_tickets > 0
                             then round((pa.our_revenue / pa.spend) * ci.low  / pa.our_tickets, 2) end,
      'true_roas_high', case when pa.spend > 0 and pa.our_tickets > 0
                             then round((pa.our_revenue / pa.spend) * ci.high / pa.our_tickets, 2) end,
      'quality_ranking',         g.quality_ranking,
      'engagement_rate_ranking', g.engagement_rate_ranking,
      'conversion_rate_ranking', g.conversion_rate_ranking,
      'rankings_as_of',          g.graded_on
    ) order by pa.spend desc, pa.our_revenue desc)
    from per_ad pa
    cross join lateral public.poisson_ci95(pa.our_tickets::numeric) ci
    left join grades g on g.ad_id = pa.ad_id
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
      'fees', fees,
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
      'fees', coalesce(sum(fees), 0),
      'paid', coalesce(sum(paid), 0),
      'cost_per_booking', case when coalesce(sum(bookings),0) > 0
                               then round(sum(spend) / sum(bookings), 2) end,
      'cost_per_ticket', case when coalesce(sum(tickets),0) > 0
                              then round(sum(spend) / sum(tickets), 2) end,
      'true_roas', case when coalesce(sum(spend),0) > 0
                        then round(sum(revenue) / sum(spend), 2) end,
      'enough_to_judge', (select t.tickets >= (select judge_min_tickets from rules) from tot t),
      'true_roas_low', (
        select case when t.spend > 0 and t.tickets > 0
                    then round((t.revenue / t.spend) * c.low / t.tickets, 2) end
        from tot t, tot_ci c
      ),
      'true_roas_high', (
        select case when t.spend > 0 and t.tickets > 0
                    then round((t.revenue / t.spend) * c.high / t.tickets, 2) end
        from tot t, tot_ci c
      ),
      'fees_by_method', coalesce((
        select jsonb_agg(jsonb_build_object(
          'method', method,
          'fee_rate', fee_rate,
          'payments', payments,
          'paid', paid,
          'ticket_money', ticket_money,
          'fees', fees
        ) order by fees desc, payments desc)
        from method_mix
      ), '[]'::jsonb)
    ) from per_day
  ),
  'diagnostics', jsonb_build_object(
    'spend_with_no_bookings', coalesce((
      select round(sum(spend), 2) from per_ad where spend > 0 and our_leads = 0
    ), 0),
    'ads_with_spend', (select count(*) from per_ad where spend > 0),
    'meta_visits_without_ad_id', (
      select count(*) from public.applications a
      where a.attribution->>'utm_source' = 'meta'
        and coalesce(a.attribution->>'utm_content','') !~ '^[0-9]{6,}$'
        and (a.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
    ),
    'bookings_with_no_spend_row', coalesce((
      select sum(our_leads) from per_ad where spend = 0 and our_leads > 0
    ), 0),
    'fee_unknown_payments', (select coalesce(sum(fee_unknown_payments), 0) from per_day),
    'fee_unknown_amount',   (select coalesce(sum(fee_unknown_amount), 0) from per_day),
    'last_sync_at', (select max(ran_at) from public.meta_ads_sync_log),
    'last_sync_ok', (select ok from public.meta_ads_sync_log order by ran_at desc limit 1),
    'last_sync_error', (
      select case when not ok then
        coalesce(error_code, 'error') ||
        case when error_detail is not null then ': ' || error_detail else '' end
      end
      from public.meta_ads_sync_log order by ran_at desc limit 1
    ),
    'last_row_synced_at', (select max(synced_at) from public.meta_ad_daily)
  )
) end;
$function$;

revoke all on function public.get_meta_ads_performance(date, date) from public, anon, authenticated;
grant execute on function public.get_meta_ads_performance(date, date) to authenticated, service_role;
