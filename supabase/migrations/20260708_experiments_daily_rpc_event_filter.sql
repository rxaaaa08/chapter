-- Add an optional per-event filter to get_experiments_daily.
--
-- Why: features often affect one event only (marketers hired just for Chill
-- Sunday Meetup; single-payment mode first used there too). The snapshots have
-- always been per-event (analytics_daily.event_id); this lets the Experiments
-- tab scope its trend chart and Before/After card to a single event instead of
-- pooling the whole site.
--
-- p_event_id NULL (default) = pooled across all events, same output as before.
-- p_event_id set = only that event's rows. Note the site-wide metrics
-- (visitors, pageviews) live on rows with event_id NULL, so they naturally
-- return no data when an event filter is applied — the tab says "no data"
-- rather than showing a misleading site-wide number against one event.
--
-- The old zero-arg overload is dropped (not kept alongside) so PostgREST never
-- has to disambiguate two functions with the same name.

DROP FUNCTION IF EXISTS public.get_experiments_daily();

CREATE OR REPLACE FUNCTION public.get_experiments_daily(p_event_id text DEFAULT NULL)
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
        WHERE p_event_id IS NULL OR event_id = p_event_id
        GROUP BY day, metric
      ) t
    ), '[]'::jsonb)
  END;
$$;

REVOKE ALL ON FUNCTION public.get_experiments_daily(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_experiments_daily(text) TO authenticated, service_role;
