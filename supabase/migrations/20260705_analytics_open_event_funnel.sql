-- Add an open-event funnel to get_analytics_summary.
--
-- The invite funnel (application_started → submitted → approved → advance_paid)
-- doesn't describe open events: open bookings never fire application_*
-- analytics events and never pass through "approved". Their whole funnel lives
-- in the DB instead:
--   details submitted = an applications row exists (created at "proceed to pay")
--   clicked Pay        = a payu_payments row exists for that (event_slug, phone)
--   paid               = status advance_paid / fully_paid
--   abandoned          = cart_abandoned flag (set by the cart-abandonment cron:
--                        past the window, never clicked Pay) — INCLUDING leads
--                        who later recovered (the flag is not cleared)
--   recovered          = cart_abandoned AND recovered_at set (paid after abandoning)
--   messaged           = a retarget WhatsApp actually sent (bill_opens
--                        .cart_abandonment_sent = true) for a genuinely-abandoned
--                        lead — lets the tab show recovery among leads we
--                        actually re-engaged, separate from raw recovery.
--
-- This block returns per-event counts for open events only; the Analytics tab
-- pools them (respecting the event filter) and derives:
--   Abandonment rate      = abandoned / details_submitted
--   Recovery rate         = recovered / abandoned
--   Retargeted recovery   = recovered_messaged / messaged
--
-- Also adds 'details_form_opened' to the captured funnel stages so the open
-- details-form open ping (added client-side next) starts populating a
-- form-completion rate without another migration.
--
-- Phone matching uses the same right(regexp_replace(...),10) shape as the
-- existing event_doubts block: applications/bill_opens/payu_payments all store
-- last-10-digit phones, but normalising both sides is robust to any drift.
-- payu_payments / bill_opens membership is tested with EXISTS (not a join) so a
-- lead with multiple rows in either table can't fan out the counts.
CREATE OR REPLACE FUNCTION public.get_analytics_summary(p_since timestamp with time zone)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
                       'application_started','application_submitted',
                       'details_form_opened')
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
  WHERE e.booking_url IS DISTINCT FROM 'payu-hosted'   -- exclude open events (no approval step)
  GROUP BY e.id
),
open_apps AS (
  SELECT
    e.id::text AS event_id,
    count(*)                                                                        AS details_submitted,
    count(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM public.payu_payments p
      WHERE p.event_slug = a.event_slug
        AND right(regexp_replace(p.phone,'\D','','g'),10)
            = right(regexp_replace(a.phone,'\D','','g'),10)
    ))                                                                              AS pay_clicked,
    count(*) FILTER (WHERE lower(a.status) IN ('advance_paid','fully_paid'))         AS paid,
    count(*) FILTER (WHERE a.cart_abandoned IS TRUE)                                 AS abandoned,
    count(*) FILTER (WHERE a.cart_abandoned IS TRUE AND a.recovered_at IS NOT NULL)  AS recovered,
    count(*) FILTER (WHERE a.cart_abandoned IS TRUE AND EXISTS (
      SELECT 1 FROM public.bill_opens b
      WHERE b.event_slug = a.event_slug
        AND right(regexp_replace(b.phone,'\D','','g'),10)
            = right(regexp_replace(a.phone,'\D','','g'),10)
        AND b.cart_abandonment_sent IS TRUE
    ))                                                                              AS messaged,
    count(*) FILTER (WHERE a.cart_abandoned IS TRUE AND a.recovered_at IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.bill_opens b
      WHERE b.event_slug = a.event_slug
        AND right(regexp_replace(b.phone,'\D','','g'),10)
            = right(regexp_replace(a.phone,'\D','','g'),10)
        AND b.cart_abandonment_sent IS TRUE
    ))                                                                              AS recovered_messaged
  FROM public.events e
  JOIN public.applications a
    ON a.event_slug = e.slug
   AND a.created_at >= p_since
  WHERE e.booking_url = 'payu-hosted'
  GROUP BY e.id
),
event_doubts AS (
  SELECT
    e.id::text AS event_id,
    count(ds.id) AS total,
    count(ds.id) FILTER (WHERE EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.event_slug = e.slug
        AND right(regexp_replace(a.phone,'\D','','g'),10)
            = right(regexp_replace(ds.phone,'\D','','g'),10)
    )) AS solved
  FROM public.events e
  LEFT JOIN public.doubt_submissions ds
    ON (lower(ds.event_title) = lower(e.title) OR lower(ds.event_title) = lower(e.slug))
   AND ds.submitted_at >= p_since
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
  ),
  'open_funnel', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_id', event_id,
      'details_submitted', details_submitted,
      'pay_clicked', pay_clicked,
      'paid', paid,
      'abandoned', abandoned,
      'recovered', recovered,
      'messaged', messaged,
      'recovered_messaged', recovered_messaged
    )), '[]'::jsonb)
    FROM open_apps
  ),
  'doubts_per_event', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('event_id', event_id, 'total', total, 'solved', solved)), '[]'::jsonb)
    FROM event_doubts
  )
);
$function$;
