-- Read RPC for the Experiments tab.
--
-- analytics_daily already holds >1,700 rows and grows daily; a direct table
-- SELECT from the client would hit PostgREST's 1000-row cap and silently
-- truncate history — the exact bug 20260603_analytics_scale.sql fixed for the
-- Analytics tab. Same cure: aggregate server-side, return one jsonb blob.
--
-- Pools each metric across events per day (the tab's v1 charts are site-wide;
-- per-event drill-down can query the table directly later with filters).
-- Unlike get_analytics_summary, this one gates on is_admin_strict() inside the
-- function: it returns [] for anyone who isn't the admin role.

CREATE OR REPLACE FUNCTION public.get_experiments_daily()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT public.is_admin_strict() THEN '[]'::jsonb
    ELSE COALESCE((
      SELECT jsonb_agg(jsonb_build_object('day', day, 'metric', metric, 'value', v) ORDER BY day)
      FROM (
        SELECT day, metric, sum(value)::int AS v
        FROM public.analytics_daily
        GROUP BY day, metric
      ) t
    ), '[]'::jsonb)
  END;
$$;

REVOKE ALL ON FUNCTION public.get_experiments_daily() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_experiments_daily() TO authenticated, service_role;
