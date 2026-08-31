-- Multi-ticket, part 2: make money maths ticket-aware.
--
-- Founder's decisions (2026-08-29):
--   * Marketer + manager commission stay FLAT per booking regardless of how many
--     tickets it holds -> accrue_marketer_sale/accrue_manager_sale need NO change.
--   * The creator's 8% is per TICKET.
--
-- The creator change is NOT optional and is easy to miss: accrue_affiliate_sale
-- computes 8% of affiliate_full_price(slug, city) -- it reads the EVENT's ticket
-- price, not the amount the customer actually paid -- so a percentage does NOT
-- multiply by itself. Without this, a 3-ticket booking pays a creator for one.

create or replace function public.accrue_affiliate_sale()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_enabled boolean;
  v_pct     numeric(5,2);
  v_flat    numeric(10,2);
  v_full    numeric(10,2);
  v_amount  numeric(10,2);
  v_qty     integer;
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.affiliate_id IS NOT NULL
  THEN
    SELECT affiliate_enabled, COALESCE(affiliate_commission_pct, 8), affiliate_commission
      INTO v_enabled, v_pct, v_flat
      FROM events WHERE slug = NEW.event_slug;

    -- Per-ticket commission x tickets bought. A no-show does not reduce it: the
    -- creator delivered the sale, and we kept that seat's advance.
    v_qty := GREATEST(COALESCE(NEW.ticket_count, 1), 1);

    IF COALESCE(v_enabled, false) THEN
      IF COALESCE(v_flat, 0) > 0 THEN
        v_amount := round(v_flat * v_qty, 2);
      ELSE
        v_full   := affiliate_full_price(NEW.event_slug, NEW.selected_city);
        v_amount := round(COALESCE(v_pct, 8) / 100.0 * COALESCE(v_full, 0) * v_qty, 2);
      END IF;

      IF v_amount > 0 THEN
        INSERT INTO affiliate_sales (application_id, affiliate_id, amount)
        VALUES (NEW.id, NEW.affiliate_id, v_amount)
        ON CONFLICT (application_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END
$function$;

-- affiliate_sales is one row per BOOKING, so anything that counted those rows as
-- "tickets" now undercounts. LEFT JOIN + coalesce(...,1) so a sale whose
-- application row was deleted still counts as the single ticket it used to.

create or replace function public.affiliate_leaderboard()
returns table(handle text, name text, tickets integer, earned numeric, is_me boolean)
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT a.handle,
         a.name,
         COALESCE(sum(COALESCE(ap.ticket_count, 1)), 0)::int AS tickets,
         COALESCE(sum(s.amount), 0) AS earned,
         (a.id = current_affiliate_id()) AS is_me
    FROM affiliates a
    LEFT JOIN affiliate_sales s ON s.affiliate_id = a.id
    LEFT JOIN applications ap   ON ap.id = s.application_id
   WHERE a.active = true
     AND (current_affiliate_id() IS NOT NULL OR is_admin())
   GROUP BY a.id, a.handle, a.name
   ORDER BY earned DESC, tickets DESC;
$function$;

create or replace function public.creator_stats()
returns table(clicks_total integer, clicks_unique integer, apps_total integer, tickets_paid integer, earned_total numeric, earned_unpaid numeric)
language sql
stable
security definer
set search_path to 'public'
as $function$
  WITH me AS (SELECT current_affiliate_id() AS id)
  SELECT
    (SELECT count(*)::int FROM affiliate_clicks c, me WHERE c.affiliate_id = me.id),
    (SELECT count(DISTINCT coalesce(c.session_id, c.id::text))::int FROM affiliate_clicks c, me WHERE c.affiliate_id = me.id),
    (SELECT count(*)::int FROM applications a, me WHERE a.affiliate_id = me.id),
    (SELECT COALESCE(sum(COALESCE(ap.ticket_count, 1)), 0)::int
       FROM affiliate_sales s
       LEFT JOIN applications ap ON ap.id = s.application_id
       CROSS JOIN me
      WHERE s.affiliate_id = me.id),
    (SELECT COALESCE(sum(s.amount), 0) FROM affiliate_sales s, me WHERE s.affiliate_id = me.id),
    (SELECT COALESCE(sum(s.amount), 0) FROM affiliate_sales s, me WHERE s.affiliate_id = me.id AND s.paid_out_at IS NULL);
$function$;

create or replace function public.creator_stats_since(p_from timestamp with time zone)
returns table(clicks_total integer, clicks_unique integer, apps_total integer, tickets_paid integer, earned numeric)
language sql
stable
security definer
set search_path to 'public'
as $function$
  WITH me AS (SELECT current_affiliate_id() AS id)
  SELECT
    (SELECT count(*)::int FROM affiliate_clicks c, me WHERE c.affiliate_id = me.id AND c.created_at >= p_from),
    (SELECT count(DISTINCT coalesce(c.session_id, c.id::text))::int FROM affiliate_clicks c, me WHERE c.affiliate_id = me.id AND c.created_at >= p_from),
    (SELECT count(*)::int FROM applications a, me WHERE a.affiliate_id = me.id AND a.created_at >= p_from),
    (SELECT COALESCE(sum(COALESCE(ap.ticket_count, 1)), 0)::int
       FROM affiliate_sales s
       LEFT JOIN applications ap ON ap.id = s.application_id
       CROSS JOIN me
      WHERE s.affiliate_id = me.id AND s.accrued_at >= p_from),
    (SELECT COALESCE(sum(s.amount), 0) FROM affiliate_sales s, me WHERE s.affiliate_id = me.id AND s.accrued_at >= p_from);
$function$;
create or replace function public.get_performance_summary()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
WITH bounds AS (
  SELECT date_trunc('month', (now() AT TIME ZONE 'Asia/Kolkata')) AS m0
),
pay AS (
  SELECT p.event_slug, p.payment_type,
    -- Multi-ticket: the net-price branches are PER TICKET, so they must be
    -- multiplied by how many tickets this payment covered. The ELSE branch is
    -- the raw charged amount, which already includes every ticket.
    CASE p.payment_type
      WHEN 'advance' THEN event_net_price(p.event_slug, a.selected_city, 'advance') * COALESCE(p.quantity, 1)
      WHEN 'balance' THEN (event_net_price(p.event_slug, a.selected_city, 'full')
                           - event_net_price(p.event_slug, a.selected_city, 'advance')) * COALESCE(p.quantity, 1)
      WHEN 'full'    THEN event_net_price(p.event_slug, a.selected_city, 'full') * COALESCE(p.quantity, 1)
      ELSE p.amount
    END AS amount,
    COALESCE(p.quantity, 1) AS quantity,
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
    SUM( -- Revenue: every ticket pays the advance, but at a pay-at-venue event
         -- only those who turned up pay the balance. attended_count is NULL
         -- until the venue payment lands (and on every non-PAV event), which
         -- collapses this back to full price x tickets.
         event_net_price(a.event_slug, a.selected_city, 'advance') * a.ticket_count
         + ( event_net_price(a.event_slug, a.selected_city, 'full')
             - event_net_price(a.event_slug, a.selected_city, 'advance') )
           * COALESCE(a.attended_count, a.ticket_count)
         -- A no-show still costs us their seat.
         - e.cost_per_ticket * a.ticket_count
         -- Marketer and manager commission are FLAT per booking by decision,
         -- so they are deliberately NOT multiplied.
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
         -- The creator's cut IS per ticket.
         - CASE WHEN e.affiliate_enabled AND a.affiliate_id IS NOT NULL
                THEN COALESCE(
                       NULLIF(e.affiliate_commission, 0),
                       round(
                         COALESCE(e.affiliate_commission_pct, 8) / 100.0
                         * public.affiliate_full_price(a.event_slug, a.selected_city),
                         2
                       )
                     ) * a.ticket_count
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
    -- Was COUNT(DISTINCT phone10): one seat per buyer. Now sums the tickets each
    -- payment covered. Verified a no-op on pre-multi-ticket data (no event has
    -- two successful advance/full rows for one phone).
    COALESCE(SUM(p.quantity) FILTER (
      WHERE p.payment_type IN ('advance','full')
    ),0) AS tickets,
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
    COALESCE(SUM(p.quantity) FILTER (
      WHERE p.payment_type IN ('advance','full')
    ),0) AS tickets
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
