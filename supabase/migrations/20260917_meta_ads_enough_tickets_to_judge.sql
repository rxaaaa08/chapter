-- "Too few tickets to judge": how much weight each ad's numbers can bear.
--
-- WHY THIS EXISTS
-- Growth ▸ Ads shows cost per ticket and true ROAS for every ad, and colours
-- ROAS green or red, however few paid tickets sit behind it. At this account's
-- volume an ad's "result" is usually a handful of tickets, and 2 tickets
-- against 1 is luck, not a winner. Meta's "Optimization Tips" says to shift
-- budget toward the best performers; done on these numbers it moves money on
-- noise, and a large budget change can also restart learning (Meta help
-- 316478108955072). META-ADS-HANDOFF.md §23. Asked for by the founder on
-- 2026-09-16 ("build both of them").
--
-- WHAT IT ADDS to get_meta_ads_performance (every existing key unchanged):
--   judge_min_tickets              10, the floor below which an ad is marked
--   per_ad.enough_to_judge         our_tickets >= 10
--   per_ad.cost_per_ticket_low/high  likely range of the REAL cost per ticket
--   per_ad.true_roas_low/high        likely range of the real true ROAS
--   totals.enough_to_judge, totals.true_roas_low/high   the same, account-wide
--
-- THE RANGE is a 95% interval on a Poisson count of paid tickets
-- (poisson_ci95), which is what a count of independent sales behaves like.
-- Spend is known exactly; the uncertainty is in how many tickets that spend
-- "really" buys, so cost per ticket = spend / (ticket range) and true ROAS
-- scales with it. Rough on purpose: it treats every ticket as worth the
-- average, which is fine for "is this ad better than that one yet".
--
-- WHY 10. With 10 tickets the real count plausibly lies anywhere from about 5
-- to 18, i.e. the true cost per ticket from about half to double the figure
-- shown. Below 10 it is wider still (at 4 tickets, a third to nearly triple),
-- and ranking ads is guesswork. 10 is a floor for "worth comparing", not proof;
-- the range is shown either way so the spread stays visible as tickets arrive.

-- ---------------------------------------------------------------------------
-- 95% interval for a Poisson count.
-- ---------------------------------------------------------------------------
-- Wilson–Hilferty approximation to the exact chi-square interval. Within about
-- 3% of the exact bounds from n = 5 upward (verified 2026-09-17), and cruder at
-- n = 1-2, where every conclusion is "too few" anyway. n = 0 gives [0, ~3.7].
create or replace function public.poisson_ci95(p_n numeric, out low numeric, out high numeric)
language sql
immutable
set search_path to 'public'
as $$
  select
    case
      when p_n is null or p_n < 0 then null
      when p_n = 0 then 0::numeric
      else round(p_n * power(greatest(1 - 1 / (9 * p_n) - 1.959964 / (3 * sqrt(p_n)), 0), 3), 4)
    end,
    case
      when p_n is null or p_n < 0 then null
      else round((p_n + 1) * power(1 - 1 / (9 * (p_n + 1)) + 1.959964 / (3 * sqrt(p_n + 1)), 3), 4)
    end;
$$;

comment on function public.poisson_ci95(numeric) is
  'Approximate 95% interval for a Poisson count (Wilson-Hilferty). Used to show how far an ad''s cost per ticket and true ROAS could really be from the figure shown.';

revoke all on function public.poisson_ci95(numeric) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_meta_ads_performance, with the judge fields.
-- ---------------------------------------------------------------------------
-- Otherwise identical to 20260916_meta_ads_true_roas_net_of_fees.sql (ticket
-- money, fees removed per payment method).
create or replace function public.get_meta_ads_performance(
  p_since date default (current_date - 29),
  p_until date default current_date
)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
with
-- The floor below which an ad's numbers are marked "too few tickets to judge".
-- Reasoning in the migration header.
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
-- Every successful payment, split into the ticket money the business keeps and
-- the gateway fee the customer paid on top at their method's rate.
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
    -- Unsplittable payments count at the amount paid: never silently dropped,
    -- and surfaced through fee_unknown_* below.
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
-- The fee per payment method, over the same bookings as the revenue above.
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
-- Account-wide sums, once, so the totals' range uses the same arithmetic as each ad's.
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
      -- Ticket money, fee removed.
      'our_revenue', pa.our_revenue,
      'our_fees', pa.our_fees,
      'our_paid', pa.our_paid,
      'cost_per_lead',    case when pa.our_leads     > 0 then round(pa.spend / pa.our_leads, 2) end,
      'cost_per_booking', case when pa.our_bookings  > 0 then round(pa.spend / pa.our_bookings, 2) end,
      'cost_per_ticket',  case when pa.our_tickets   > 0 then round(pa.spend / pa.our_tickets, 2) end,
      'cost_per_customer',case when pa.our_completed > 0 then round(pa.spend / pa.our_completed, 2) end,
      'true_roas',        case when pa.spend > 0 then round(pa.our_revenue / pa.spend, 2) end,
      'meta_roas',        case when pa.spend > 0 then round(pa.meta_purchase_value / pa.spend, 2) end,
      -- Enough paid tickets behind these numbers to compare this ad with another?
      'enough_to_judge',  pa.our_tickets >= (select judge_min_tickets from rules),
      -- Where the real figures plausibly lie (95%). Null where a bound does not
      -- exist, e.g. no upper cost bound when the low ticket count is 0.
      'cost_per_ticket_low',  case when pa.our_tickets > 0 and ci.high > 0 then round(pa.spend / ci.high, 2) end,
      'cost_per_ticket_high', case when pa.our_tickets > 0 and ci.low  > 0 then round(pa.spend / ci.low, 2) end,
      'true_roas_low',  case when pa.spend > 0 and pa.our_tickets > 0
                             then round((pa.our_revenue / pa.spend) * ci.low  / pa.our_tickets, 2) end,
      'true_roas_high', case when pa.spend > 0 and pa.our_tickets > 0
                             then round((pa.our_revenue / pa.spend) * ci.high / pa.our_tickets, 2) end
    ) order by pa.spend desc, pa.our_revenue desc)
    from per_ad pa
    cross join lateral public.poisson_ci95(pa.our_tickets::numeric) ci
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
      -- Ticket money, fee removed. paid = revenue + fees (+ any unsplit fee).
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
    -- Payments whose fee could not be split. Counted at the amount paid, so
    -- revenue on these may still include up to ~5% of fee. 0 is the healthy value.
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
