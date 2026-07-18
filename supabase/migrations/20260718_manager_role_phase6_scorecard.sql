-- Manager role — Phase 6: the manager scorecard.
-- 1) manager_scorecards_internal(): per-manager outcome + activity metrics —
--    conversion vs all-events benchmark, fill rate, stale/pending-age,
--    cart-abandon recovery, doubt closure, revenue vs commission (ROI), and
--    activity derived from admin_audit_log (actions/7d, last active, hires).
--    Ungated so the cron digest can reuse it.
-- 2) get_manager_scorecards(): strict-admin wrapper — feeds the Managers
--    card in the Performance tab. Everyone else gets NULL.
-- 3) A 'manager_scorecard' row in manager_rules + weekly_manager_digest():
--    Monday-evening digest that raises one info alert per active manager in
--    the existing Briefing tab (the 36KB evaluate_manager_rules() function
--    only evaluates rule_types it codes for, so the extra rule row is inert
--    to it — deliberately additive, no risky splice into that function) and
--    sends one combined push via notify_admin_push. Cron: Monday 12:45 UTC
--    = 6:15pm IST, right after the daily 6pm brief.

CREATE OR REPLACE FUNCTION public.manager_scorecards_internal()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH mgr_events AS (
  SELECT em.manager_id, em.event_slug FROM event_managers em
),
apps AS (
  SELECT me.manager_id, a.event_slug, a.selected_city, a.status, a.created_at,
         a.cart_abandoned, a.recovered_at
  FROM applications a JOIN mgr_events me ON me.event_slug = a.event_slug
),
per_mgr_apps AS (
  SELECT manager_id,
    count(*) AS leads,
    count(*) FILTER (WHERE status='advance_paid') AS advance_paid,
    count(*) FILTER (WHERE status='fully_paid')   AS fully_paid,
    count(*) FILTER (WHERE status IN ('pending','invited')
                       AND created_at < now() - interval '48 hours') AS stale,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM now() - created_at)/3600)
      FILTER (WHERE status = 'pending') AS pending_age_h,
    count(*) FILTER (WHERE recovered_at IS NOT NULL) AS recovered,
    count(*) FILTER (WHERE cart_abandoned OR recovered_at IS NOT NULL) AS abandoned_ever,
    COALESCE(sum(CASE status
      WHEN 'fully_paid'   THEN event_net_price(event_slug, selected_city, 'full')
      WHEN 'advance_paid' THEN event_net_price(event_slug, selected_city, 'advance')
      ELSE 0 END), 0) AS revenue
  FROM apps GROUP BY manager_id
),
fill AS (
  -- Fill rate = converted tickets ÷ (per-date capacity × number of dates),
  -- summed over the manager's events that actually declare a capacity.
  SELECT me.manager_id,
    sum((SELECT count(*) FROM applications a
         WHERE a.event_slug = me.event_slug
           AND a.status IN ('advance_paid','fully_paid'))) AS sold,
    sum(COALESCE(e.total_capacity, e.invite_spots)
        * GREATEST((SELECT count(*) FROM event_dates d WHERE d.event_id = e.id), 1)) AS cap
  FROM mgr_events me JOIN events e ON e.slug = me.event_slug
  WHERE COALESCE(e.total_capacity, e.invite_spots) IS NOT NULL
  GROUP BY me.manager_id
),
doubts AS (
  -- Doubt closure uses the same non-gameable signal as the Doubts tab: a
  -- doubt counts as closed only when that person actually applied.
  SELECT me.manager_id,
    count(*) AS total,
    count(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM applications a
      WHERE a.event_slug = me.event_slug
        AND a.phone = right(regexp_replace(COALESCE(ds.phone,''),'\D','','g'),10)
    )) AS closed
  FROM doubt_submissions ds
  JOIN mgr_events me ON me.event_slug = resolve_event_slug(ds.event_title)
  GROUP BY me.manager_id
),
activity AS (
  SELECT m.id AS manager_id,
    count(al.*) FILTER (WHERE al.created_at > now() - interval '7 days') AS actions_7d,
    max(al.created_at) AS last_active,
    count(al.*) FILTER (WHERE al.action = 'manager_hire_marketer') AS hires
  FROM managers m LEFT JOIN admin_audit_log al ON al.admin_email = m.email
  GROUP BY m.id
),
benchmark AS (
  SELECT count(*) FILTER (WHERE status='fully_paid')::numeric / NULLIF(count(*), 0) AS conv
  FROM applications
)
SELECT jsonb_build_object(
  'benchmark_conversion_pct', round(COALESCE((SELECT conv FROM benchmark), 0) * 100, 1),
  'managers', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'manager_id',        m.id,
      'name',              m.name,
      'active',            m.active,
      'events',            (SELECT count(*) FROM mgr_events me WHERE me.manager_id = m.id),
      'leads',             COALESCE(p.leads, 0),
      'advance_paid',      COALESCE(p.advance_paid, 0),
      'fully_paid',        COALESCE(p.fully_paid, 0),
      'stale',             COALESCE(p.stale, 0),
      'conversion_pct',    CASE WHEN COALESCE(p.leads,0) > 0 THEN round(p.fully_paid::numeric / p.leads * 100, 1) END,
      'fill_pct',          CASE WHEN COALESCE(f.cap,0)   > 0 THEN round(f.sold::numeric / f.cap * 100, 1) END,
      'pending_age_h',     CASE WHEN p.pending_age_h IS NOT NULL THEN round(p.pending_age_h::numeric, 1) END,
      'recovery_pct',      CASE WHEN COALESCE(p.abandoned_ever,0) > 0 THEN round(p.recovered::numeric / p.abandoned_ever * 100, 1) END,
      'doubt_closure_pct', CASE WHEN COALESCE(d.total,0) > 0 THEN round(d.closed::numeric / d.total * 100, 1) END,
      'revenue',           COALESCE(p.revenue, 0),
      'commission',        COALESCE((SELECT sum(amount) FROM manager_sales ms WHERE ms.manager_id = m.id), 0),
      'actions_7d',        COALESCE(act.actions_7d, 0),
      'last_active',       act.last_active,
      'hires',             COALESCE(act.hires, 0)
    ) ORDER BY COALESCE(p.revenue, 0) DESC, m.created_at)
    FROM managers m
    LEFT JOIN per_mgr_apps p ON p.manager_id = m.id
    LEFT JOIN fill f          ON f.manager_id = m.id
    LEFT JOIN doubts d        ON d.manager_id = m.id
    LEFT JOIN activity act    ON act.manager_id = m.id
  ), '[]'::jsonb)
)
$$;

REVOKE ALL ON FUNCTION public.manager_scorecards_internal() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manager_scorecards_internal() TO service_role;

-- Strict-admin wrapper for the Performance tab.
CREATE OR REPLACE FUNCTION public.get_manager_scorecards()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE WHEN is_admin_strict() THEN manager_scorecards_internal() END
$$;

REVOKE ALL ON FUNCTION public.get_manager_scorecards() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_manager_scorecards() TO authenticated, service_role;

-- Briefing rule row: inert to evaluate_manager_rules() (it selects rules by
-- the rule_types it codes for), owns the digest's alerts + lets the founder
-- disable the digest from the existing rules UI.
INSERT INTO public.manager_rules (rule_type, label, description, severity, cadence, cooldown_days, enabled, sort_order, template)
SELECT 'manager_scorecard', 'Manager scorecard',
       'Weekly per-manager digest: conversion vs average, fill rate, stale leads, revenue vs commission, activity.',
       'info', 'weekly', 7, true,
       COALESCE((SELECT max(sort_order) + 1 FROM public.manager_rules), 99),
       '{name} — weekly scorecard'
WHERE NOT EXISTS (SELECT 1 FROM public.manager_rules WHERE rule_type = 'manager_scorecard');

-- Weekly digest: one info alert per active manager with events, one combined
-- push. Fingerprint scoped to the ISO week, so re-runs in the same week
-- refresh the alert instead of duplicating it.
CREATE OR REPLACE FUNCTION public.weekly_manager_digest(p_send_push boolean DEFAULT true)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rule_id uuid;
  v_week    text := to_char((now() AT TIME ZONE 'Asia/Kolkata')::date, 'IYYY-IW');
  v_day     date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_cards   jsonb;
  card      jsonb;
  v_fp      text;
  v_body    text;
  v_parts   text[] := '{}';
  v_count   integer := 0;
BEGIN
  SELECT id INTO v_rule_id FROM manager_rules WHERE rule_type = 'manager_scorecard' AND enabled;
  IF v_rule_id IS NULL THEN RETURN 0; END IF;

  v_cards := manager_scorecards_internal();

  FOR card IN SELECT * FROM jsonb_array_elements(v_cards->'managers') LOOP
    CONTINUE WHEN NOT (card->>'active')::boolean OR (card->>'events')::int = 0;
    v_fp := 'manager_scorecard|' || (card->>'manager_id') || '|' || v_week;
    v_body := (card->>'leads') || ' leads · ' || (card->>'fully_paid') || ' paid'
      || COALESCE(' (' || (card->>'conversion_pct') || '% vs ' || (v_cards->>'benchmark_conversion_pct') || '% avg)', '')
      || COALESCE(' · fill ' || (card->>'fill_pct') || '%', '')
      || ' · ' || (card->>'stale') || ' stale'
      || ' · ₹' || (card->>'revenue') || ' revenue vs ₹' || (card->>'commission') || ' commission'
      || ' · ' || (card->>'actions_7d') || ' actions/7d'
      || COALESCE(' · ' || (card->>'hires') || ' hires', '');

    IF EXISTS (SELECT 1 FROM manager_alerts
               WHERE fingerprint = v_fp AND status IN ('open','acknowledged','snoozed')) THEN
      UPDATE manager_alerts SET body = v_body, last_seen_at = now(), briefing_day = v_day
      WHERE fingerprint = v_fp AND status IN ('open','acknowledged','snoozed');
    ELSE
      INSERT INTO manager_alerts (rule_id, rule_type, fingerprint, severity, title, body, briefing_day, data)
      VALUES (v_rule_id, 'manager_scorecard', v_fp, 'info',
              '📇 ' || (card->>'name') || ' — weekly scorecard', v_body, v_day,
              jsonb_build_object('manager_id', card->>'manager_id', 'week', v_week));
    END IF;

    v_parts := array_append(v_parts, (card->>'name') || ': ' || (card->>'fully_paid') || ' paid, '
      || (card->>'stale') || ' stale' || COALESCE(', fill ' || (card->>'fill_pct') || '%', ''));
    v_count := v_count + 1;
  END LOOP;

  IF v_count > 0 AND p_send_push THEN
    PERFORM notify_admin_push(jsonb_build_object(
      'type', 'manager_brief',
      'record', jsonb_build_object(
        'title', '📇 Weekly manager scorecard',
        'body',  array_to_string(v_parts, ' · ')
      )));
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.weekly_manager_digest(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_manager_digest(boolean) TO service_role;

-- Monday 12:45 UTC = 6:15pm IST, just after the daily 6pm brief.
SELECT cron.schedule('weekly_manager_digest', '45 12 * * 1', 'SELECT public.weekly_manager_digest()');
