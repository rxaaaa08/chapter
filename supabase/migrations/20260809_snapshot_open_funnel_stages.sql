-- Snapshot the open-event stages that were added on 2026-08-07/08, so they
-- survive the 90-day flow_analytics purge.
--
-- The gap: get_analytics_summary learned about 'details_form_submitted' and the
-- OTP verification step, but snapshot_analytics_daily (the permanent record that
-- feeds Growth ▸ Experiments) never did. flow_analytics is purged nightly at
-- 90 days by purge_flow_analytics, so without this every Form Completion number
-- would silently vanish three months after it was recorded — and the Verification
-- Rate would have no daily trend at all.
--
-- Adds:
--   * 'details_form_submitted' to the per-event funnel stage list
--   * 'otp_requested' / 'otp_verified' to the DB-truth block, counted as DISTINCT
--     phones per day, mirroring get_analytics_summary exactly — including the
--     90000000xx test-range exclusion, so a testing session can't inflate the
--     permanent record the way the 9-11 Jul burst inflated the live one.
--
-- Everything else is reproduced verbatim from the live definition (dumped
-- 2026-08-09). The function stays idempotent — it deletes the day before
-- reinserting — so re-running it for a past day never double-counts.

CREATE OR REPLACE FUNCTION public.snapshot_analytics_daily(p_day date DEFAULT (((now() AT TIME ZONE 'Asia/Kolkata'::text))::date - 1))
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
                        'details_form_opened','details_form_submitted')
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
    UNION ALL
    -- Open-event verification step. DISTINCT phones, test range excluded — the
    -- same shape get_analytics_summary uses, so the permanent record and the
    -- live tab can never disagree.
    SELECT 'otp_requested', count(DISTINCT right(regexp_replace(o.phone,'\D','','g'),10))::int
      FROM public.open_event_otp_sessions o
     WHERE lower(o.event_slug) = lower(e.slug)
       AND o.created_at >= v_from AND o.created_at < v_to
       AND right(regexp_replace(o.phone,'\D','','g'),10) NOT LIKE '90000000%'
    UNION ALL
    SELECT 'otp_verified', count(DISTINCT right(regexp_replace(o.phone,'\D','','g'),10))::int
      FROM public.open_event_otp_sessions o
     WHERE lower(o.event_slug) = lower(e.slug)
       AND o.created_at >= v_from AND o.created_at < v_to
       AND o.verified_at IS NOT NULL
       AND right(regexp_replace(o.phone,'\D','','g'),10) NOT LIKE '90000000%'
  ) m
  WHERE m.value > 0;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

  RETURN v_count;
END;
$function$;
