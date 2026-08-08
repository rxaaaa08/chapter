-- Open-event funnel: make every rate divide like units, and stop hiding the
-- OTP step.
--
-- Three problems this fixes, all in the Analytics tab's OPEN branch:
--
-- 1. "Form Completion" divided applications ROWS by browser SESSIONS. The row
--    is one-per-(event, phone) forever — a cart-abandoner who comes back
--    tomorrow adds a second form-open session but never a second row (the
--    duplicate-key error is swallowed as success in AppFlow), so the rate was
--    biased down hardest for exactly the returning-abandoner population open
--    events depend on. Now there is a session-scoped 'details_form_submitted'
--    ping to pair with 'details_form_opened', so both sides count sessions.
--
-- 2. The WhatsApp OTP sits BETWEEN filling the form and the row being written,
--    so "opened the form -> submitted" silently meant "opened the form, filled
--    it, AND passed OTP". The OTP is now its own step, counted from
--    open_event_otp_sessions (distinct phones requested vs verified). That
--    table goes back further than the new ping, so this step has real history
--    from day one.
--
-- 3. open_apps INNER JOINed applications, so an open event with zero bookings
--    in the window produced no open_funnel row at all and vanished from the
--    per-event cards — the events most worth looking at. LEFT JOIN now, with
--    count(a.id) so a zero-booking event reads 0 instead of 1.
--
-- Everything else is reproduced verbatim from the live definition (dumped and
-- byte-compared against 20260719_analytics_summary_admin_gate.sql on
-- 2026-08-07 — no drift), including the is_admin_strict() gate.
--
-- OTP phone/slug matching mirrors the existing blocks: last-10-digits on the
-- phone, lower() on the slug (the edge function takes the slug from the client,
-- which sends Event.id casing as-is).

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
    w.city,
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
                       'details_form_opened','details_form_submitted')
  GROUP BY resolved_event_id, event_type
),
funnel_converted AS (
  SELECT resolved_event_id, 'converted_any' AS stage, count(DISTINCT session_id) AS sessions
  FROM resolved
  WHERE resolved_event_id IS NOT NULL
    AND event_type IN ('book_cta_clicked','contact_cta_clicked','pricing_cta_clicked')
  GROUP BY resolved_event_id
),
funnel_by_city AS (
  SELECT resolved_event_id, city, event_type AS stage, count(DISTINCT session_id) AS sessions
  FROM resolved
  WHERE resolved_event_id IS NOT NULL
    AND city IS NOT NULL AND city <> ''
    AND event_type IN ('reached_pricing','book_cta_clicked','contact_cta_clicked','pricing_cta_clicked')
  GROUP BY resolved_event_id, city, event_type
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
  WHERE e.booking_url IS DISTINCT FROM 'payu-hosted'
  GROUP BY e.id
),
open_apps AS (
  SELECT
    e.id::text AS event_id,
    count(a.id)                                                                     AS details_submitted,
    count(a.id) FILTER (WHERE EXISTS (
      SELECT 1 FROM public.payu_payments p
      WHERE p.event_slug = a.event_slug
        AND right(regexp_replace(p.phone,'\D','','g'),10)
            = right(regexp_replace(a.phone,'\D','','g'),10)
    ))                                                                              AS pay_clicked,
    count(a.id) FILTER (WHERE lower(a.status) IN ('advance_paid','fully_paid'))      AS paid,
    count(a.id) FILTER (WHERE a.cart_abandoned IS TRUE)                              AS abandoned,
    count(a.id) FILTER (WHERE a.cart_abandoned IS TRUE AND a.recovered_at IS NOT NULL) AS recovered,
    count(a.id) FILTER (WHERE a.cart_abandoned IS TRUE AND EXISTS (
      SELECT 1 FROM public.bill_opens b
      WHERE b.event_slug = a.event_slug
        AND right(regexp_replace(b.phone,'\D','','g'),10)
            = right(regexp_replace(a.phone,'\D','','g'),10)
        AND b.cart_abandonment_sent IS TRUE
    ))                                                                              AS messaged,
    count(a.id) FILTER (WHERE a.cart_abandoned IS TRUE AND a.recovered_at IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.bill_opens b
      WHERE b.event_slug = a.event_slug
        AND right(regexp_replace(b.phone,'\D','','g'),10)
            = right(regexp_replace(a.phone,'\D','','g'),10)
        AND b.cart_abandonment_sent IS TRUE
    ))                                                                              AS recovered_messaged
  FROM public.events e
  LEFT JOIN public.applications a
    ON a.event_slug = e.slug
   AND a.created_at >= p_since
  WHERE e.booking_url = 'payu-hosted'
  GROUP BY e.id
),
open_otp AS (
  SELECT
    e.id::text AS event_id,
    count(DISTINCT right(regexp_replace(o.phone,'\D','','g'),10))                   AS otp_requested,
    count(DISTINCT right(regexp_replace(o.phone,'\D','','g'),10))
      FILTER (WHERE o.verified_at IS NOT NULL)                                      AS otp_verified,
    -- Verified but no booking row: a real person who gave us their number and
    -- passed the code, yet has nothing in applications. payu-callback back-fills
    -- the row for anyone who PAYS, so these are unpaid leads that fell out of the
    -- CRM entirely — no People row, no cart-abandonment WhatsApp, no marketer.
    count(DISTINCT right(regexp_replace(o.phone,'\D','','g'),10)) FILTER (
      WHERE o.verified_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.applications a
          WHERE a.event_slug = e.slug
            AND right(regexp_replace(a.phone,'\D','','g'),10)
                = right(regexp_replace(o.phone,'\D','','g'),10)
        )
    )                                                                               AS verified_no_row
  FROM public.events e
  JOIN public.open_event_otp_sessions o
    ON lower(o.event_slug) = lower(e.slug)
   AND o.created_at >= p_since
   -- Drop the documented test range (CLAUDE.md: use 90000000xx for test rows).
   -- The purger never cleaned this table, so test bookings otherwise sit in the
   -- Verification Rate forever.
   AND right(regexp_replace(o.phone,'\D','','g'),10) NOT LIKE '90000000%'
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
SELECT CASE WHEN is_admin_strict() THEN jsonb_build_object(
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
  'pricing_by_city', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('event_id', resolved_event_id, 'city', city, 'stage', stage, 'sessions', sessions)), '[]'::jsonb)
    FROM funnel_by_city
  ),
  'apps_per_event', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('event_id', event_id, 'approved', approved, 'advance_paid', advance_paid)), '[]'::jsonb)
    FROM event_apps
  ),
  'open_funnel', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_id', oa.event_id,
      'details_submitted', oa.details_submitted,
      'pay_clicked', oa.pay_clicked,
      'paid', oa.paid,
      'abandoned', oa.abandoned,
      'recovered', oa.recovered,
      'messaged', oa.messaged,
      'recovered_messaged', oa.recovered_messaged,
      'otp_requested', COALESCE(oo.otp_requested, 0),
      'otp_verified',  COALESCE(oo.otp_verified, 0),
      'verified_no_row', COALESCE(oo.verified_no_row, 0)
    )), '[]'::jsonb)
    FROM open_apps oa
    LEFT JOIN open_otp oo ON oo.event_id = oa.event_id
  ),
  -- When each client-side stage started being recorded, plus the window start,
  -- so the UI can tell "nobody did this" apart from "we weren't measuring yet".
  -- Without it a newly-added ping reads as a confident 0% against a denominator
  -- full of history — which is exactly how Form Completion showed 0 of 41.
  'since', p_since,
  'stage_first_seen', (
    SELECT COALESCE(jsonb_object_agg(event_type, first_seen), '{}'::jsonb)
    FROM (
      SELECT event_type, min(created_at) AS first_seen
      FROM public.flow_analytics
      WHERE event_type IN ('details_form_opened','details_form_submitted')
      GROUP BY event_type
    ) t
  ),
  'doubts_per_event', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('event_id', event_id, 'total', total, 'solved', solved)), '[]'::jsonb)
    FROM event_doubts
  )
) END;
$function$;
