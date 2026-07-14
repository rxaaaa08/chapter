-- Add a per-(event, city) breakdown of the pricing-screen funnel so the admin
-- Analytics tab can split "Pricing Conversion Rate" by city. Multi-city events
-- can charge a different price per city (city_details[city].price_full), but the
-- pooled funnel hid whether one city's price was choking conversion.
--
-- The `city` was already stored on every flow_analytics row, so this is purely
-- surfacing data we already have — no new tracking, works retroactively.
--
-- This is ADDITIVE: the existing `funnel` array stays pooled by (event, stage)
-- exactly as before (every existing card keeps working). We only add a new
-- `pricing_by_city` array: [{event_id, city, stage, sessions}] for the four
-- pricing/CTA stages. Rows with a null/blank city are dropped from this split
-- (a genuine multi-city session always has a city selected before the price
-- screen). A session that switched city mid-flow is stamped with the city
-- active when reached_pricing first fired — acceptable, and rare.
--
-- NOTE: this CREATE OR REPLACE is based on the LIVE function definition (which
-- had drifted ahead of the checked-in migrations: it already carries the
-- open_apps/open_funnel block and details_form_opened). We preserve all of that
-- verbatim and only add `w.city` to `resolved`, the `funnel_by_city` CTE, and
-- the `pricing_by_city` output key.
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
