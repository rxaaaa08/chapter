-- Waitlist join for the invite flow. applications is RLS-locked: anon has no
-- UPDATE/SELECT, and the anon INSERT policy only allows status='pending'. So
-- the old client-side update().select() + insert(status:'waitlist') silently
-- failed after the lockdown. This SECURITY DEFINER function performs the
-- waitlist upsert with the owner's privileges, callable by anon — without
-- granting anon any read/update access to applications.
--
-- Never downgrades an already-paid applicant (advance_paid/fully_paid).
CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_phone      text,
  p_event_slug text,
  p_name       text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone   text;
  v_name    text;
  v_updated int;
BEGIN
  v_phone := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  IF length(v_phone) <> 10 THEN RETURN; END IF;
  IF coalesce(p_event_slug, '') = '' THEN RETURN; END IF;
  v_name := left(coalesce(nullif(btrim(p_name), ''), 'Waitlist guest'), 80);

  UPDATE public.applications
    SET status = 'waitlist'
    WHERE phone = v_phone
      AND event_slug = p_event_slug
      AND status NOT IN ('advance_paid', 'fully_paid');
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 AND NOT EXISTS (
    SELECT 1 FROM public.applications WHERE phone = v_phone AND event_slug = p_event_slug
  ) THEN
    INSERT INTO public.applications (event_slug, name, phone, gender, why_join, status)
    VALUES (p_event_slug, v_name, v_phone, '', '', 'waitlist');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.join_waitlist(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text, text, text) TO anon, authenticated;
