-- Make the Performance dashboard understand single-payment ('full') bookings, not
-- just split (advance/balance). Changes vs prior version:
--   * pay.amount: a 'full' payment is valued at the configured full price.
--   * ev_agg: 'full' payments count toward tickets, price-per-ticket, and revenue;
--     an event shows if it has ANY successful booking (not only a non-zero advance).
--   * mk_rev: marketer ticket counts include 'full' payments.
CREATE OR REPLACE FUNCTION public.get_performance_summary()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
WITH bounds AS (
  SELECT date_trunc('month', (now() AT TIME ZONE 'Asia/Kolkata')) AS m0
),
pay AS (
  SELECT p.event_slug, p.payment_type,
    CASE p.payment_type
      WHEN 'advance' THEN event_net_price(p.event_slug, a.selected_city, 'advance')
      WHEN 'balance' THEN event_net_price(p.event_slug, a.selected_city, 'full')
                        - event_net_price(p.event_slug, a.selected_city, 'advance')
      WHEN 'full'    THEN event_net_price(p.event_slug, a.selected_city, 'full')
      ELSE p.amount
    END AS amount,
    event_net_price(p.event_slug, a.selected_city, 'full') AS full_price,
    right(regexp_replace(p.phone,'\D','','g'),10) AS phone10
  FROM public.payu_payments p
  LEFT JOIN LATERAL (
    SELECT a2.selected_city FROM public.applications a2
    WHERE a2.event_slug = p.event_slug
      AND right(regexp_replace(a2.phone,'\D','','g'),10) = right(regexp_replace(p.phone,'\D','','g'),10)
    LIMIT 1
  ) a ON true
  WHERE p.status = 'success'
),
ev_committed AS (
  SELECT a.event_slug,
    SUM( event_net_price(a.event_slug, a.selected_city, 'full')
         - e.cost_per_ticket
         - COALESCE(cm.commission_amount, 0) ) AS committed_profit
  FROM public.applications a
  JOIN public.events e ON e.slug = a.event_slug
  LEFT JOIN public.call_marketers cm ON cm.id = a.assigned_marketer_id
  WHERE a.status IN ('advance_paid','fully_paid')
  GROUP BY a.event_slug
),
ev_balmonth AS (
  SELECT e.slug AS event_slug,
    (SELECT (elem->>'date')::date FROM jsonb_array_elements(e.booking_steps::jsonb) elem
     WHERE elem->>'value' = '{balance}' AND COALESCE(elem->>'date','') <> '' LIMIT 1) AS bal_date
  FROM public.events e
),
ev_bucketed AS (
  SELECT GREATEST(
           date_trunc('month', COALESCE(b.bal_date, (SELECT m0 FROM bounds)::date)),
           (SELECT m0 FROM bounds)
         ) AS m,
         c.committed_profit
  FROM ev_committed c
  LEFT JOIN ev_balmonth b ON b.event_slug = c.event_slug
),
months6 AS (
  SELECT generate_series((SELECT m0 FROM bounds), (SELECT m0 FROM bounds) + interval '5 months', interval '1 month') AS m
),
forecast AS (
  SELECT to_char(mo.m,'YYYY-MM') AS month,
         COALESCE((SELECT sum(committed_profit) FROM ev_bucketed b WHERE b.m = mo.m), 0) AS profit
  FROM months6 mo ORDER BY mo.m
),
comm AS (
  SELECT ms.marketer_id, ms.amount FROM public.marketer_sales ms
),
ev_agg AS (
  SELECT e.id::text AS event_id, e.title, e.slug, e.cost_per_ticket, e.is_active,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='advance'),0) AS advance_collected,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='balance'),0) AS balance_collected,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='full'),0)    AS full_collected,
    COUNT(DISTINCT p.phone10) FILTER (WHERE p.payment_type IN ('advance','full'))    AS tickets,
    COALESCE(AVG(p.full_price) FILTER (WHERE p.payment_type IN ('advance','full')),0) AS price_per_ticket
  FROM public.events e LEFT JOIN pay p ON p.event_slug = e.slug
  GROUP BY e.id, e.title, e.slug, e.cost_per_ticket, e.is_active
  HAVING COUNT(p.phone10) > 0
),
mk_rev AS (
  SELECT a.assigned_marketer_id AS marketer_id,
    COALESCE(SUM(p.amount),0) AS revenue_generated,
    COUNT(DISTINCT p.phone10) FILTER (WHERE p.payment_type IN ('advance','full')) AS tickets
  FROM public.applications a
  JOIN pay p ON p.event_slug = a.event_slug AND p.phone10 = right(regexp_replace(a.phone,'\D','','g'),10)
  WHERE a.assigned_marketer_id IS NOT NULL GROUP BY a.assigned_marketer_id
),
mk_assigned AS (
  SELECT assigned_marketer_id AS marketer_id, count(*) AS assigned
  FROM public.applications
  WHERE assigned_marketer_id IS NOT NULL AND status <> 'rejected'
  GROUP BY assigned_marketer_id
)
SELECT jsonb_build_object(
  'this_month_profit', (SELECT profit FROM forecast WHERE month = to_char((SELECT m0 FROM bounds),'YYYY-MM')),
  'committed_total',   (SELECT COALESCE(sum(committed_profit),0) FROM ev_committed),
  'fixed_costs_total', (SELECT COALESCE(sum(amount),0) FROM public.fixed_costs WHERE active),
  'forecast', (SELECT COALESCE(jsonb_agg(jsonb_build_object('month',month,'profit',profit)),'[]'::jsonb) FROM forecast),
  'per_event', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_id', event_id, 'title', title, 'cost_per_ticket', cost_per_ticket, 'is_active', is_active,
      'tickets', tickets, 'advance_collected', advance_collected, 'balance_collected', balance_collected,
      'revenue', advance_collected + balance_collected + full_collected,
      'price_per_ticket', price_per_ticket
    ) ORDER BY (advance_collected + balance_collected + full_collected) DESC), '[]'::jsonb) FROM ev_agg
  ),
  'per_marketer', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'marketer_id', cm.id, 'name', cm.name, 'active', cm.active,
      'assigned', COALESCE(asg.assigned,0),
      'tickets', COALESCE(r.tickets,0),
      'commission', COALESCE((SELECT sum(amount) FROM comm WHERE comm.marketer_id = cm.id),0),
      'revenue_generated', COALESCE(r.revenue_generated,0)
    ) ORDER BY COALESCE(r.revenue_generated,0) DESC, COALESCE(asg.assigned,0) DESC), '[]'::jsonb)
    FROM public.call_marketers cm
    LEFT JOIN mk_rev r ON r.marketer_id = cm.id
    LEFT JOIN mk_assigned asg ON asg.marketer_id = cm.id
  )
);
$$;
