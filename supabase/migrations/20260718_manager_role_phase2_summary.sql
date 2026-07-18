-- Manager role — Phase 2: get_manager_summary() RPC.
-- Per-marketer performance rollups for the caller's managed events, powering
-- the manager dashboard's team table (marketer ROI). SECURITY DEFINER because
-- revenue needs event_net_price() over ALL of the event's applications and
-- the marketer commission ledger — but everything is scoped to the caller's
-- event_managers rows, and non-managers get NULL.
--
-- Revenue = configured net price per converted ticket (full price for
-- fully_paid, advance for advance_paid) — same "money the founder configured,
-- not gross PayU" rule as get_performance_summary. Commission = accrued
-- marketer_sales on those events. stale = pending/invited leads older than
-- 48h with no conversion — the manager's daily to-do number.

CREATE OR REPLACE FUNCTION public.get_manager_summary()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH me AS (SELECT current_manager_id() AS id),
my_events AS (
  SELECT em.event_slug FROM event_managers em, me WHERE em.manager_id = me.id
),
apps AS (
  SELECT a.id, a.event_slug, a.selected_city, a.status, a.created_at, a.assigned_marketer_id
  FROM applications a
  WHERE a.event_slug IN (SELECT event_slug FROM my_events)
),
per_marketer AS (
  SELECT cm.id AS marketer_id, cm.name, cm.active,
    count(a.id) AS leads,
    count(a.id) FILTER (WHERE a.status = 'advance_paid') AS advance_paid,
    count(a.id) FILTER (WHERE a.status = 'fully_paid')   AS fully_paid,
    count(a.id) FILTER (WHERE a.status IN ('pending','invited')
                          AND a.created_at < now() - interval '48 hours') AS stale_leads,
    COALESCE(sum(
      CASE a.status
        WHEN 'fully_paid'   THEN event_net_price(a.event_slug, a.selected_city, 'full')
        WHEN 'advance_paid' THEN event_net_price(a.event_slug, a.selected_city, 'advance')
        ELSE 0
      END), 0) AS revenue
  FROM call_marketers cm
  JOIN apps a ON a.assigned_marketer_id = cm.id
  GROUP BY cm.id, cm.name, cm.active
),
comm AS (
  SELECT ms.marketer_id, sum(ms.amount) AS commission
  FROM marketer_sales ms
  JOIN apps a ON a.id = ms.application_id
  GROUP BY ms.marketer_id
)
SELECT CASE WHEN (SELECT id FROM me) IS NULL THEN NULL ELSE jsonb_build_object(
  'marketers', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'marketer_id', p.marketer_id,
      'name',        p.name,
      'active',      p.active,
      'leads',       p.leads,
      'advance_paid',p.advance_paid,
      'fully_paid',  p.fully_paid,
      'stale_leads', p.stale_leads,
      'revenue',     p.revenue,
      'commission',  COALESCE(c.commission, 0)
    ) ORDER BY p.revenue DESC, p.leads DESC)
    FROM per_marketer p LEFT JOIN comm c ON c.marketer_id = p.marketer_id
  ), '[]'::jsonb),
  'unassigned_stale', (
    SELECT count(*) FROM apps a
    WHERE a.assigned_marketer_id IS NULL
      AND a.status IN ('pending','invited')
      AND a.created_at < now() - interval '48 hours'
  )
) END
$$;

REVOKE ALL ON FUNCTION public.get_manager_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_manager_summary() TO authenticated, service_role;
