-- Finances forecast: bucket by event date when there is no balance-due date.
--
-- get_performance_summary() forecasts profit by month by reading the balance-due
-- date off each event's booking_steps ({balance} row). Pay-at-Venue events strip
-- that date on purpose (the balance is settled in person, with no deadline), so
-- their bal_date was always NULL and ev_bucketed dumped ALL of their committed
-- profit into the CURRENT month instead of the month the event actually happens.
--
-- Fix: for PAV split events (pay_at_venue AND payment_mode='split'), when no
-- balance-due date is present fall back to the event's own date — earliest
-- upcoming event_dates.start_date, else latest. Scoped to PAV split only:
-- single-payment events are already collected in full (stay current-month) and
-- normal split events carry a real balance date. Everything else is verbatim
-- from the live definition (dump-first discipline). committed_total's advance-vs-
-- fully_paid rule is deliberately unchanged.

CREATE OR REPLACE FUNCTION public.get_performance_summary()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      AND right(regexp_replace(a2.phone,'\D','','g'),10)
          = right(regexp_replace(p.phone,'\D','','g'),10)
    LIMIT 1
  ) a ON true
  WHERE p.status = 'success'
),
ev_manager AS (
  SELECT DISTINCT ON (em.event_slug) em.event_slug, m.commission_amount
  FROM public.event_managers em
  JOIN public.managers m ON m.id = em.manager_id AND m.active
  ORDER BY em.event_slug, em.created_at
),
ev_committed AS (
  SELECT a.event_slug,
    SUM( event_net_price(a.event_slug, a.selected_city, 'full')
         - e.cost_per_ticket
         - CASE
             WHEN e.booking_url = 'payu-hosted'
              AND NOT public.open_lead_was_worked(
                        a.event_slug,
                        a.phone,
                        a.cart_abandoned
                      )
             THEN round(COALESCE(e.marketer_commission, cm.commission_amount, 0) / 2)
             ELSE COALESCE(e.marketer_commission, cm.commission_amount, 0)
           END
         - CASE WHEN mgr.commission_amount IS NOT NULL
                THEN COALESCE(e.manager_commission, mgr.commission_amount)
                ELSE 0 END
         - CASE WHEN e.affiliate_enabled AND a.affiliate_id IS NOT NULL
                THEN COALESCE(
                       NULLIF(e.affiliate_commission, 0),
                       round(
                         COALESCE(e.affiliate_commission_pct, 8) / 100.0
                         * public.affiliate_full_price(a.event_slug, a.selected_city),
                         2
                       )
                     )
                ELSE 0 END ) AS committed_profit
  FROM public.applications a
  JOIN public.events e ON e.slug = a.event_slug
  LEFT JOIN public.call_marketers cm ON cm.id = a.assigned_marketer_id
  LEFT JOIN ev_manager mgr ON mgr.event_slug = a.event_slug
  WHERE a.status IN ('advance_paid','fully_paid')
  GROUP BY a.event_slug
),
ev_balmonth AS (
  SELECT e.slug AS event_slug,
    COALESCE(
      (SELECT (elem->>'date')::date
         FROM jsonb_array_elements(e.booking_steps::jsonb) elem
        WHERE elem->>'value' = '{balance}'
          AND COALESCE(elem->>'date','') <> ''
        LIMIT 1),
      -- Pay-at-Venue split events have no balance-due date (the balance is
      -- collected in person at the venue), so bucket their committed profit by
      -- the event's own date — earliest upcoming date, else latest — instead of
      -- letting it fall through to the current month. Scoped to PAV split only:
      -- single-payment events are already collected in full (belong in the month
      -- collected, i.e. the current-month fallback), and normal split events
      -- carry a real balance-due date above.
      CASE WHEN e.pay_at_venue AND e.payment_mode = 'split' THEN
        COALESCE(
          (SELECT min(ed.start_date)
             FROM public.event_dates ed
            WHERE ed.event_id = e.id
              AND ed.start_date >= ((now() AT TIME ZONE 'Asia/Kolkata')::date)),
          (SELECT max(ed.start_date)
             FROM public.event_dates ed
            WHERE ed.event_id = e.id)
        )
      END
    ) AS bal_date
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
  SELECT generate_series(
           (SELECT m0 FROM bounds),
           (SELECT m0 FROM bounds) + interval '5 months',
           interval '1 month'
         ) AS m
),
forecast AS (
  SELECT to_char(mo.m,'YYYY-MM') AS month,
         COALESCE((
           SELECT sum(committed_profit) FROM ev_bucketed b WHERE b.m = mo.m
         ), 0) AS profit
  FROM months6 mo
  ORDER BY mo.m
),
comm AS (
  SELECT ms.marketer_id, ms.amount FROM public.marketer_sales ms
),
ev_agg AS (
  SELECT e.id::text AS event_id, e.title, e.slug, e.cost_per_ticket, e.is_active,
    COALESCE(e.marketer_commission, 50) AS commission_per_ticket,
    CASE WHEN mgr.commission_amount IS NOT NULL
         THEN COALESCE(e.manager_commission, mgr.commission_amount)
         ELSE 0 END AS manager_commission_per_ticket,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='advance'),0) AS advance_collected,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='balance'),0) AS balance_collected,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type='full'),0) AS full_collected,
    COUNT(DISTINCT p.phone10) FILTER (
      WHERE p.payment_type IN ('advance','full')
    ) AS tickets,
    COALESCE(AVG(p.full_price) FILTER (
      WHERE p.payment_type IN ('advance','full')
    ),0) AS price_per_ticket
  FROM public.events e
  LEFT JOIN pay p ON p.event_slug = e.slug
  LEFT JOIN ev_manager mgr ON mgr.event_slug = e.slug
  GROUP BY e.id, e.title, e.slug, e.cost_per_ticket, e.is_active,
           e.marketer_commission, e.manager_commission, mgr.commission_amount
  HAVING COUNT(p.phone10) > 0
),
mk_rev AS (
  SELECT a.assigned_marketer_id AS marketer_id,
    COALESCE(SUM(p.amount),0) AS revenue_generated,
    COUNT(DISTINCT p.phone10) FILTER (
      WHERE p.payment_type IN ('advance','full')
    ) AS tickets
  FROM public.applications a
  JOIN pay p
    ON p.event_slug = a.event_slug
   AND p.phone10 = right(regexp_replace(a.phone,'\D','','g'),10)
  WHERE a.assigned_marketer_id IS NOT NULL
  GROUP BY a.assigned_marketer_id
),
mk_assigned AS (
  SELECT assigned_marketer_id AS marketer_id, count(*) AS assigned
  FROM public.applications
  WHERE assigned_marketer_id IS NOT NULL AND status <> 'rejected'
  GROUP BY assigned_marketer_id
)
SELECT CASE WHEN is_admin_strict() THEN jsonb_build_object(
  'this_month_profit', (
    SELECT profit FROM forecast
     WHERE month = to_char((SELECT m0 FROM bounds),'YYYY-MM')
  ),
  'committed_total', (
    SELECT COALESCE(sum(committed_profit),0) FROM ev_committed
  ),
  'fixed_costs_total', (
    SELECT COALESCE(sum(amount),0) FROM public.fixed_costs WHERE active
  ),
  'forecast', (
    SELECT COALESCE(
      jsonb_agg(jsonb_build_object('month',month,'profit',profit)),
      '[]'::jsonb
    ) FROM forecast
  ),
  'per_event', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_id', event_id,
      'title', title,
      'cost_per_ticket', cost_per_ticket,
      'is_active', is_active,
      'commission_per_ticket', commission_per_ticket,
      'manager_commission_per_ticket', manager_commission_per_ticket,
      'tickets', tickets,
      'advance_collected', advance_collected,
      'balance_collected', balance_collected,
      'revenue', advance_collected + balance_collected + full_collected,
      'price_per_ticket', price_per_ticket
    ) ORDER BY (advance_collected + balance_collected + full_collected) DESC), '[]'::jsonb)
    FROM ev_agg
  ),
  'per_marketer', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'marketer_id', cm.id,
      'name', cm.name,
      'active', cm.active,
      'assigned', COALESCE(asg.assigned,0),
      'tickets', COALESCE(r.tickets,0),
      'commission', COALESCE((
        SELECT sum(amount) FROM comm WHERE comm.marketer_id = cm.id
      ),0),
      'revenue_generated', COALESCE(r.revenue_generated,0)
    ) ORDER BY COALESCE(r.revenue_generated,0) DESC, COALESCE(asg.assigned,0) DESC), '[]'::jsonb)
    FROM public.call_marketers cm
    LEFT JOIN mk_rev r ON r.marketer_id = cm.id
    LEFT JOIN mk_assigned asg ON asg.marketer_id = cm.id
  )
) END;
$function$;
