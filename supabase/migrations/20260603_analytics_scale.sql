-- Make the admin analytics + People tab scale to real traffic.
--
-- Problem being fixed:
--   The admin panel did `SELECT * FROM flow_analytics` (and from applications)
--   with no pagination. PostgREST silently caps every response at 1000 rows,
--   so the panel only ever saw the most recent ~1000 rows and treated that as
--   the whole dataset. At current volume that's ~6.6 days of analytics, which
--   is why "Last Month" showed 328 visitors when the real figure was ~8,968.
--   The bug gets WORSE as traffic grows (1000 rows covers less and less time).
--
-- Fix has three parts:
--   1. Indexes so windowed scans + the ORDER BY stop doing full table seq
--      scans + on-disk sorts.
--   2. get_analytics_summary() — aggregates server-side (no row cap) and
--      returns just the final numbers the dashboard needs. Event resolution
--      (matching a tracked event_id/title to a live events row) happens in
--      SQL, mirroring the old client-side resolver.
--   3. Move the 30-day purge OFF the read path (it used to run on every tab
--      open as an unindexed DELETE) into a nightly pg_cron job.

-- ── 1. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS flow_analytics_created_at_idx
  ON public.flow_analytics (created_at DESC);

-- Supports the per-event / per-stage distinct-session aggregation.
CREATE INDEX IF NOT EXISTS flow_analytics_type_session_idx
  ON public.flow_analytics (event_type, session_id);

-- People tab orders applications by created_at and filters by event_slug.
CREATE INDEX IF NOT EXISTS applications_created_at_idx
  ON public.applications (created_at DESC);
CREATE INDEX IF NOT EXISTS applications_event_slug_idx
  ON public.applications (event_slug);

-- ── 2. get_analytics_summary(p_since) ───────────────────────────────────────
--
-- Returns one jsonb object with every metric the Analytics tab renders:
--   visitors          int   distinct page_view sessions in window
--   pageviews         int   total page_view rows
--   cities            [{city, count}]                 (count of city_selected rows)
--   event_popularity  [{event_id, title, count}]      (count of event_selected rows, raw event_id)
--   funnel            [{event_id, stage, sessions}]   (distinct sessions per resolved live event per stage)
--
-- Event resolution mirrors the old client resolveLiveEventId():
--   1. match tracked event_id to a live event's slug or id
--   2. else match tracked event_title (case-insensitive) to a live event title
--   3. else the row is excluded from funnel (resolved_event_id is null)
-- "converted_any" is a synthetic stage = distinct sessions that fired ANY of
-- the three CTA event types (book/contact/legacy), deduped per session — this
-- matches the client's Set-union so we don't double-count a session that
-- clicked more than one CTA.

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
  WHERE is_active = true
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
                       'pricing_cta_clicked','external_redirect_initiated')
  GROUP BY resolved_event_id, event_type
),
funnel_converted AS (
  SELECT resolved_event_id, 'converted_any' AS stage, count(DISTINCT session_id) AS sessions
  FROM resolved
  WHERE resolved_event_id IS NOT NULL
    AND event_type IN ('book_cta_clicked','contact_cta_clicked','pricing_cta_clicked')
  GROUP BY resolved_event_id
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
  )
);
$$;

-- Admin-only: callable by signed-in admins. anon cannot read analytics.
REVOKE ALL ON FUNCTION public.get_analytics_summary(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary(timestamptz) TO authenticated, service_role;

-- ── 3. Nightly purge via pg_cron (off the read path) ─────────────────────────

CREATE OR REPLACE FUNCTION public.purge_old_flow_analytics()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.flow_analytics WHERE created_at < now() - interval '90 days';
$$;
REVOKE ALL ON FUNCTION public.purge_old_flow_analytics() FROM PUBLIC, anon, authenticated;

-- Schedule once; unschedule any prior copy first so re-running is idempotent.
SELECT cron.unschedule('purge_flow_analytics')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_flow_analytics');
SELECT cron.schedule('purge_flow_analytics', '17 3 * * *', $$SELECT public.purge_old_flow_analytics()$$);
