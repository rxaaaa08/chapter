-- True ROAS without the gateway fee.
--
-- WHAT CHANGED, 2026-09-16
-- get_meta_ads_performance and get_meta_recommendation_scorecard used to count
-- revenue as payu_payments.amount: what the customer paid, INCLUDING the PayU
-- fee they pay on top at a rate set by their payment method (UPI 2.42%, credit
-- card 3.67%, wallets 4.95%). PayU keeps that fee, so "true ROAS" read 2.4-5%
-- high, by an amount that depended on how customers chose to pay.
--
-- Revenue is now TICKET MONEY: each payment split by payu_fee_split() at its own
-- method's rate. The fee is reported beside it rather than dropped, broken down
-- by method, so the founder can see what customers paid, what PayU took, and
-- what the business kept.
--
-- The founder asked for this directly: "I need to know with full clarity the
-- true ROAS without the fees."
--
-- KEY MEANINGS (the live panel on origin/main reads the first four unchanged):
--   our_revenue / revenue    ticket money, fee removed        (meaning CHANGED)
--   true_roas                ticket money / spend              (meaning CHANGED)
--   our_fees / fees          gateway fees customers paid on top (new)
--   our_paid / paid          what customers paid, fee included  (new)
--   totals.fees_by_method    the fee, per payment method        (new)
--   diagnostics.fee_unknown_payments / _amount                  (new)
--
-- A payment whose fee cannot be split (payu_fee_split returns NULL) counts at
-- the amount paid, so money is never silently dropped, and is counted in
-- diagnostics.fee_unknown_* so the panel can say those may still include a fee.
-- On 2026-09-16 that count is 0 of 156.
--
-- Meta's own value (reported_value) was already fee-free, so meta_roas and
-- true_roas now compare like with like.

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
      -- Ticket money, fee removed.
      'our_revenue', our_revenue,
      'our_fees', our_fees,
      'our_paid', our_paid,
      'cost_per_lead',    case when our_leads     > 0 then round(spend / our_leads, 2) end,
      'cost_per_booking', case when our_bookings  > 0 then round(spend / our_bookings, 2) end,
      'cost_per_ticket',  case when our_tickets   > 0 then round(spend / our_tickets, 2) end,
      'cost_per_customer',case when our_completed > 0 then round(spend / our_completed, 2) end,
      'true_roas',        case when spend > 0 then round(our_revenue / spend, 2) end,
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

-- The scorecard judges Meta's recommendations on the same money, so it takes
-- the same rule. Changed by an exact text replacement against the LIVE
-- definition rather than a hand-copied body, so nothing else in it can drift,
-- and it fails loudly if the live function no longer contains the old text.
do $migration$
declare
  v_def text := pg_get_functiondef('public.get_meta_recommendation_scorecard(integer)'::regprocedure);
  v_old text := $old$    select p.event_slug, p.phone, sum(p.amount) as received
    from public.payu_payments p where p.status = 'success' group by 1, 2$old$;
  v_new text := $new$    -- Ticket money only: the gateway fee each customer paid on top, at their
    -- payment method's rate, goes to PayU. Same rule as get_meta_ads_performance.
    select p.event_slug, p.phone, sum(coalesce(f.ticket_amount, p.amount)) as received
    from public.payu_payments p
    cross join lateral public.payu_fee_split(p.amount, p.payu_response->>'mode') f
    where p.status = 'success' group by 1, 2$new$;
begin
  if position(v_new in v_def) > 0 then
    return;  -- already applied
  end if;
  if position(v_old in v_def) = 0 then
    raise exception 'get_meta_recommendation_scorecard has drifted: the revenue subquery was not found. Re-read the live definition before changing it.';
  end if;
  execute replace(v_def, v_old, v_new);
end;
$migration$;
