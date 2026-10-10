-- get_conversion_funnel: founder-only, like its sibling get_analytics_summary.
--
-- Why: it is SECURITY DEFINER (reads applications / payu_payments /
-- flow_analytics past RLS) and `authenticated` may EXECUTE it, but it had no
-- is_admin_strict() check — so any signed-in account (marketer, creator, any
-- Google login) could read the business funnel. Found by the 2026-09-28
-- OpenClaw tracking audit (S1) and proven live the same day: a non-admin JWT
-- got {applied:22, advance_paid:16, fully_paid:4, …}. Hiding the Growth tab
-- is not a permission; the function has to refuse.
--
-- Non-founders now get NULL, the same shape get_analytics_summary returns;
-- AdminPanel.loadAnalytics already treats NULL as "no funnel". Body is the
-- live definition (dumped 2026-09-28), unchanged except for the CASE gate.
CREATE OR REPLACE FUNCTION public.get_conversion_funnel(p_since timestamp with time zone)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH apps AS (
  SELECT phone, event_slug, lower(status) AS st, created_at, invite_sent_at
  FROM public.applications
  WHERE created_at >= p_since
),
adv AS (
  SELECT phone, event_slug, min(created_at) AS paid_at
  FROM public.payu_payments
  WHERE status = 'success' AND payment_type = 'advance'
  GROUP BY phone, event_slug
),
ttp AS (
  SELECT extract(epoch FROM (adv.paid_at - apps.invite_sent_at)) / 3600.0 AS hours
  FROM apps
  JOIN adv ON adv.phone = apps.phone AND adv.event_slug = apps.event_slug
  WHERE apps.invite_sent_at IS NOT NULL
    AND apps.invite_sent_at <> apps.created_at
    AND adv.paid_at >= apps.invite_sent_at
)
SELECT CASE WHEN public.is_admin_strict() THEN jsonb_build_object(
  'reached_pricing', (SELECT count(DISTINCT session_id) FROM public.flow_analytics WHERE event_type='reached_pricing'      AND created_at >= p_since),
  'app_started',     (SELECT count(DISTINCT session_id) FROM public.flow_analytics WHERE event_type='application_started'  AND created_at >= p_since),
  'app_submitted',   (SELECT count(DISTINCT session_id) FROM public.flow_analytics WHERE event_type='application_submitted' AND created_at >= p_since),
  'applied',      (SELECT count(*) FROM apps),
  'approved',     (SELECT count(*) FROM apps WHERE st IN ('invited','advance_paid','fully_paid')),
  'advance_paid', (SELECT count(*) FROM apps WHERE st IN ('advance_paid','fully_paid')),
  'fully_paid',   (SELECT count(*) FROM apps WHERE st = 'fully_paid'),
  'time_to_payment_median_hours', (SELECT round(percentile_cont(0.5) WITHIN GROUP (ORDER BY hours)::numeric, 1) FROM ttp),
  'time_to_payment_n',            (SELECT count(*) FROM ttp)
) END;
$function$;
