-- Per-event marketer commission override.
--
-- Until now every marketer earned a flat call_marketers.commission_amount
-- (default ₹50) on every fully-paid ticket, on every event. This adds an
-- optional per-event rate: when events.marketer_commission is set, every
-- marketer on that event earns THAT amount per fully-paid ticket instead of
-- their personal default. NULL = fall back to the marketer's own default
-- (so all existing events keep paying ₹50 with no data change).
--
-- Analytics stays consistent because:
--   * marketer_sales still SNAPSHOTS the effective amount at fully_paid time,
--     so changing an event's rate later never rewrites past commissions.
--   * the committed-profit forecast + per-event economics read the same
--     effective rate (event override → else marketer default).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS marketer_commission numeric(10,2);

COMMENT ON COLUMN public.events.marketer_commission IS
  'Per-event marketer commission per fully-paid ticket. NULL = use call_marketers.commission_amount (default ₹50).';

-- accrue_marketer_sale: on status → fully_paid, snapshot the EFFECTIVE
-- commission — the event override if set, else the marketer''s own default —
-- into the marketer_sales ledger. Only the amount source changes vs the
-- original in 20260617_marketers_functions_and_triggers.sql.
CREATE OR REPLACE FUNCTION public.accrue_marketer_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric(10,2);
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.assigned_marketer_id IS NOT NULL
  THEN
    SELECT COALESCE(e.marketer_commission, cm.commission_amount)
      INTO v_amount
      FROM call_marketers cm
      LEFT JOIN events e ON e.slug = NEW.event_slug
     WHERE cm.id = NEW.assigned_marketer_id;
    IF v_amount IS NOT NULL THEN
      INSERT INTO marketer_sales (application_id, marketer_id, amount)
      VALUES (NEW.id, NEW.assigned_marketer_id, v_amount)
      ON CONFLICT (application_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END
$$;

-- get_performance_summary: make the two LIVE reads of commission event-aware.
--   1. ev_committed — the on-the-way / forecast profit for advance_paid people
--      who haven't fully paid yet: use the effective per-event rate.
--   2. ev_agg — expose commission_per_ticket so the per-event unit-economics
--      table subtracts the real rate instead of a hardcoded ₹50.
-- Everything else is carried over verbatim from
-- 20260704_performance_summary_affiliate_aware.sql.
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
         - COALESCE(e.marketer_commission, cm.commission_amount, 0)
         - CASE WHEN e.affiliate_enabled AND a.affiliate_id IS NOT NULL
                THEN round(COALESCE(e.affiliate_commission_pct, 8) / 100.0
                           * event_net_price(a.event_slug, a.selected_city, 'full'), 2)
                ELSE 0 END ) AS committed_profit
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
    COALESCE(e.marketer_commission, 50) AS commission_per_ticket,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='advance'),0) AS advance_collected,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='balance'),0) AS balance_collected,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='full'),0)    AS full_collected,
    COUNT(DISTINCT p.phone10) FILTER (WHERE p.payment_type IN ('advance','full'))    AS tickets,
    COALESCE(AVG(p.full_price) FILTER (WHERE p.payment_type IN ('advance','full')),0) AS price_per_ticket
  FROM public.events e LEFT JOIN pay p ON p.event_slug = e.slug
  GROUP BY e.id, e.title, e.slug, e.cost_per_ticket, e.is_active, e.marketer_commission
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
      'commission_per_ticket', commission_per_ticket,
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
