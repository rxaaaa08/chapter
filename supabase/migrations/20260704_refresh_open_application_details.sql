-- OPEN-event returning-lead refresh. The open booking insert uses insert-or-ignore
-- on (event_slug, phone), so a returning lead who re-enters on a DIFFERENT date (or
-- changes pickup/city) keeps the booking-choice fields from their original row —
-- leaving a stale selected_date that no longer matches any event_date (breaks the
-- per-date group-chat link, warm-note dates, and balance-due lookups).
--
-- Anon has no UPDATE policy on applications (only a status='pending' INSERT), so the
-- client can't refresh the row directly — same reason attribute_open_application()
-- exists. This SECURITY DEFINER function refreshes ONLY the booking-choice fields,
-- and ONLY on an UNPAID row (never clobbers advance_paid/fully_paid).
CREATE OR REPLACE FUNCTION public.refresh_open_application(
  p_event_slug      text,
  p_phone           text,
  p_selected_date   text DEFAULT NULL,
  p_pickup_point_id text DEFAULT NULL,
  p_pickup_label    text DEFAULT NULL,
  p_selected_city   text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_phone text;
BEGIN
  v_phone := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  IF length(v_phone) <> 10 THEN RETURN; END IF;
  IF coalesce(p_event_slug, '') = '' THEN RETURN; END IF;

  UPDATE applications
     SET selected_date   = NULLIF(p_selected_date, ''),
         pickup_point_id = NULLIF(p_pickup_point_id, ''),
         pickup_label    = NULLIF(p_pickup_label, ''),
         selected_city   = NULLIF(p_selected_city, '')
   WHERE event_slug = lower(p_event_slug)
     AND phone = v_phone
     AND status NOT IN ('advance_paid', 'fully_paid');
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_open_application(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_open_application(text, text, text, text, text, text) TO anon, authenticated;
