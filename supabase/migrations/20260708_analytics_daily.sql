-- Experiments tab, Layer 2: permanent daily metric snapshots.
--
-- Why: flow_analytics is purged after 90 days (20260603_analytics_scale.sql),
-- so any before/after comparison older than ~3 months becomes impossible.
-- This table keeps one tiny row per (day, event, metric) forever — a few KB a
-- day — so trends and release comparisons survive the purge.
--
-- Shape: long format (day, event_id, metric, value). event_id NULL = site-wide.
-- Metrics snapshotted per IST calendar day (the founder's day, and the same
-- day-bucketing the release log uses):
--   site-wide : visitors, pageviews
--   from flow_analytics (distinct sessions/day/event): event_selected,
--     calendar_opened, date_selected, reached_pricing, book_cta_clicked,
--     contact_cta_clicked, pricing_cta_clicked, external_redirect_initiated,
--     application_started, application_submitted, details_form_opened,
--     converted_any (deduped union of the three CTA types)
--   from DB truth (things that HAPPENED that day): apps_created, recovered,
--     invites_sent, email_invites_sent, pay_clicked, payments_success
--
-- Event resolution mirrors get_analytics_summary exactly (tracked event_id →
-- live event slug/id, else tracked title → live title), so numbers here agree
-- with the Analytics tab.
--
-- snapshot_analytics_daily(day) is idempotent (delete-then-insert for that
-- day), so re-running a day never double-counts. pg_cron runs it nightly for
-- yesterday; the backfill below replays every day since tracking began
-- (2026-04-25) — capturing the June data before the purge eats it.

CREATE TABLE IF NOT EXISTS public.analytics_daily (
  day         date NOT NULL,
  event_id    text,               -- resolved live events.id; NULL = site-wide
  metric      text NOT NULL,
  value       integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_key
  ON public.analytics_daily (day, metric, COALESCE(event_id, ''));

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Read-only for the admin-strict role (Experiments tab); nobody writes through
-- the API — only the SECURITY DEFINER snapshot function (cron) inserts.
CREATE POLICY "analytics_daily_admin_select"
  ON public.analytics_daily FOR SELECT TO authenticated
  USING (is_admin_strict());

-- ── The snapshot function ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.snapshot_analytics_daily(p_day date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::date - 1))
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from  timestamptz := p_day::timestamp AT TIME ZONE 'Asia/Kolkata';
  v_to    timestamptz := (p_day + 1)::timestamp AT TIME ZONE 'Asia/Kolkata';
  v_count integer := 0;
  v_n     integer;
BEGIN
  DELETE FROM public.analytics_daily WHERE day = p_day;

  -- Site-wide traffic
  INSERT INTO public.analytics_daily (day, event_id, metric, value)
  SELECT p_day, NULL, 'visitors', count(DISTINCT session_id)
    FROM public.flow_analytics
   WHERE created_at >= v_from AND created_at < v_to AND event_type = 'page_view'
  UNION ALL
  SELECT p_day, NULL, 'pageviews', count(*)
    FROM public.flow_analytics
   WHERE created_at >= v_from AND created_at < v_to AND event_type = 'page_view';
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

  -- Funnel stages per resolved event (same resolution as get_analytics_summary)
  INSERT INTO public.analytics_daily (day, event_id, metric, value)
  WITH ev AS (
    SELECT id::text AS canonical, slug, id::text AS idtext, lower(title) AS ltitle
    FROM public.events
  ),
  win AS (
    SELECT event_type, session_id, event_id, event_title
    FROM public.flow_analytics
    WHERE created_at >= v_from AND created_at < v_to
  ),
  resolved AS (
    SELECT w.event_type, w.session_id,
           COALESCE(e_id.canonical, e_title.canonical) AS rid
    FROM win w
    LEFT JOIN ev e_id    ON (e_id.slug = w.event_id OR e_id.idtext = w.event_id)
    LEFT JOIN ev e_title ON (e_title.ltitle = lower(w.event_title))
  )
  SELECT p_day, rid, event_type, count(DISTINCT session_id)
    FROM resolved
   WHERE rid IS NOT NULL
     AND event_type IN ('event_selected','calendar_opened','date_selected',
                        'reached_pricing','book_cta_clicked','contact_cta_clicked',
                        'pricing_cta_clicked','external_redirect_initiated',
                        'application_started','application_submitted',
                        'details_form_opened')
   GROUP BY rid, event_type
  UNION ALL
  SELECT p_day, rid, 'converted_any', count(DISTINCT session_id)
    FROM resolved
   WHERE rid IS NOT NULL
     AND event_type IN ('book_cta_clicked','contact_cta_clicked','pricing_cta_clicked')
   GROUP BY rid;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

  -- DB-truth counts per event: things that happened that day
  INSERT INTO public.analytics_daily (day, event_id, metric, value)
  SELECT p_day, e.id::text, m.metric, m.value
  FROM public.events e
  CROSS JOIN LATERAL (
    SELECT 'apps_created' AS metric, count(*)::int AS value
      FROM public.applications a
     WHERE a.event_slug = e.slug AND a.created_at >= v_from AND a.created_at < v_to
    UNION ALL
    SELECT 'recovered', count(*)::int
      FROM public.applications a
     WHERE a.event_slug = e.slug AND a.recovered_at >= v_from AND a.recovered_at < v_to
    UNION ALL
    SELECT 'invites_sent', count(*)::int
      FROM public.applications a
     WHERE a.event_slug = e.slug AND a.invite_sent_at >= v_from AND a.invite_sent_at < v_to
    UNION ALL
    SELECT 'email_invites_sent', count(*)::int
      FROM public.applications a
     WHERE a.event_slug = e.slug AND a.email_invite_sent_at >= v_from AND a.email_invite_sent_at < v_to
    UNION ALL
    SELECT 'pay_clicked', count(*)::int
      FROM public.payu_payments p
     WHERE p.event_slug = e.slug AND p.created_at >= v_from AND p.created_at < v_to
    UNION ALL
    SELECT 'payments_success', count(*)::int
      FROM public.payu_payments p
     WHERE p.event_slug = e.slug AND lower(p.status) = 'success'
       AND p.created_at >= v_from AND p.created_at < v_to
  ) m
  WHERE m.value > 0;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

  RETURN v_count;
END;
$$;

-- Only cron (postgres) and service_role need to run this.
REVOKE ALL ON FUNCTION public.snapshot_analytics_daily(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.snapshot_analytics_daily(date) TO service_role;

-- ── Backfill every day tracking has existed ──────────────────────────────────
-- Idempotent: each day is delete-then-insert, so re-running the migration is
-- safe. ~74 days at time of writing.

DO $$
DECLARE d date;
BEGIN
  FOR d IN
    SELECT generate_series(
      (SELECT min(created_at AT TIME ZONE 'Asia/Kolkata')::date FROM public.flow_analytics),
      (now() AT TIME ZONE 'Asia/Kolkata')::date - 1,
      interval '1 day'
    )::date
  LOOP
    PERFORM public.snapshot_analytics_daily(d);
  END LOOP;
END $$;

-- ── Nightly schedule ─────────────────────────────────────────────────────────
-- 02:35 UTC = 08:05 IST: yesterday (IST) is long finished, and it runs before
-- nothing that matters — the 03:17 UTC purge only deletes rows >90 days old,
-- far from yesterday's data.

SELECT cron.unschedule('snapshot_analytics_daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'snapshot_analytics_daily');
SELECT cron.schedule('snapshot_analytics_daily', '35 2 * * *', $$SELECT public.snapshot_analytics_daily()$$);
