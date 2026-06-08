-- Extend get_analytics_summary so per-event Application Completion + Payment
-- Conversion can be rendered in the admin Analytics tab.
--
-- Adds:
--   funnel includes 'application_started' + 'application_submitted' (per resolved event)
--   apps_per_event: per-event approved + advance_paid counts (joined by slug)
CREATE OR REPLACE FUNCTION public.get_analytics_summary(p_since timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH ev AS (
  SELECT id::text AS canonical, slug, id::text AS idtext, lower(title) AS ltitle
  FROM public.events
),
win AS (
  SELECT event_type, session_id, event_id, event_title, city
  FROM public.flow_analytics
  WHERE created_at >= p_since
),
resolved AS (
  SELECT
    w.event_type,
    w.session_id,
    COALESCE(e_id.canonical, e_title.canonical) AS resolved_event_id
  FROM win w
  LEFT JOIN ev e_id    ON (e_id.slug = w.event_id OR e_id.idtext = w.event_id)
  LEFT JOIN ev e_title ON (e_title.ltitle = lower(w.event_title))
),
funnel_stages AS (
  SELECT resolved_event_id, event_type AS stage, count(DISTINCT session_id) AS sessions
  FROM resolved
  WHERE resolved_event_id IS NOT NULL
    AND event_type IN ('event_selected','calendar_opened','date_selected',
                       'reached_pricing','book_cta_clicked','contact_cta_clicked',
                       'pricing_cta_clicked','external_redirect_initiated',
                       'application_started','application_submitted')
  GROUP BY resolved_event_id, event_type
),
funnel_converted AS (
  SELECT resolved_event_id, 'converted_any' AS stage, count(DISTINCT session_id) AS sessions
  FROM resolved
  WHERE resolved_event_id IS NOT NULL
    AND event_type IN ('book_cta_clicked','contact_cta_clicked','pricing_cta_clicked')
  GROUP BY resolved_event_id
),
event_apps AS (
  SELECT
    e.id::text AS event_id,
    count(*) FILTER (WHERE lower(a.status) IN ('invited','advance_paid','fully_paid')) AS approved,
    count(*) FILTER (WHERE lower(a.status) IN ('advance_paid','fully_paid'))         AS advance_paid
  FROM public.events e
  LEFT JOIN public.applications a
    ON a.event_slug = e.slug
   AND a.created_at >= p_since
  GROUP BY e.id
)
SELECT jsonb_build_object(
  'visitors',  (SELECT count(DISTINCT session_id) FROM win WHERE event_type = 'page_view'),
  'pageviews', (SELECT count(*)                    FROM win WHERE event_type = 'page_view'),
  'cities', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('city', city, 'count', c) ORDER BY c DESC), '[]'::jsonb)
    FROM (
      SELECT city, count(*) AS c FROM win
      WHERE event_type = 'city_selected' AND city IS NOT NULL AND city <> ''
      GROUP BY city
    ) t
  ),
  'event_popularity', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('event_id', event_id, 'title', title, 'count', c) ORDER BY c DESC), '[]'::jsonb)
    FROM (
      SELECT event_id, max(event_title) AS title, count(*) AS c FROM win
      WHERE event_type = 'event_selected' AND event_id IS NOT NULL
      GROUP BY event_id
    ) t
  ),
  'funnel', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('event_id', resolved_event_id, 'stage', stage, 'sessions', sessions)), '[]'::jsonb)
    FROM (SELECT * FROM funnel_stages UNION ALL SELECT * FROM funnel_converted) f
  ),
  'apps_per_event', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('event_id', event_id, 'approved', approved, 'advance_paid', advance_paid)), '[]'::jsonb)
    FROM event_apps
  )
);
$$;
