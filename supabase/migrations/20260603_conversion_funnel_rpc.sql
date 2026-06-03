-- Native conversion funnel + post-application metrics for the admin dashboard.
-- Mixes session-based analytics (flow_analytics) with application/payment
-- records (applications, payu_payments) for the window since p_since.
CREATE OR REPLACE FUNCTION public.get_conversion_funnel(p_since timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH apps AS (
  SELECT phone, event_slug, lower(status) AS st, created_at
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
  SELECT extract(epoch FROM (adv.paid_at - apps.created_at)) / 3600.0 AS hours
  FROM apps
  JOIN adv ON adv.phone = apps.phone AND adv.event_slug = apps.event_slug
  WHERE adv.paid_at >= apps.created_at
)
SELECT jsonb_build_object(
  'reached_pricing', (SELECT count(DISTINCT session_id) FROM public.flow_analytics WHERE event_type='reached_pricing'      AND created_at >= p_since),
  'app_started',     (SELECT count(DISTINCT session_id) FROM public.flow_analytics WHERE event_type='application_started'  AND created_at >= p_since),
  'app_submitted',   (SELECT count(DISTINCT session_id) FROM public.flow_analytics WHERE event_type='application_submitted' AND created_at >= p_since),
  'applied',      (SELECT count(*) FROM apps),
  'approved',     (SELECT count(*) FROM apps WHERE st IN ('invited','advance_paid','fully_paid')),
  'advance_paid', (SELECT count(*) FROM apps WHERE st IN ('advance_paid','fully_paid')),
  'fully_paid',   (SELECT count(*) FROM apps WHERE st = 'fully_paid'),
  'time_to_payment_median_hours', (SELECT round(percentile_cont(0.5) WITHIN GROUP (ORDER BY hours)::numeric, 1) FROM ttp),
  'time_to_payment_n',            (SELECT count(*) FROM ttp)
);
$$;

REVOKE ALL ON FUNCTION public.get_conversion_funnel(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel(timestamptz) TO authenticated, service_role;
