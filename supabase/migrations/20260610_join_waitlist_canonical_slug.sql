-- join_waitlist: resolve the inbound slug (which may be either events.slug
-- OR events.invite_slug) to the canonical events.slug before any read/
-- update/insert. Without this, a user invited via invite_slug who joins
-- the waitlist gets a SECOND applications row keyed by the invite_slug,
-- because the "already paid" guard couldn't match across slug variants —
-- producing duplicates like (advance_paid + waitlist) for the same person/event.
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
  v_slug    text;
  v_updated int;
BEGIN
  v_phone := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  IF length(v_phone) <> 10 THEN RETURN; END IF;
  IF coalesce(p_event_slug, '') = '' THEN RETURN; END IF;
  v_name := left(coalesce(nullif(btrim(p_name), ''), 'Waitlist guest'), 80);

  -- Canonical slug resolution: match by slug OR invite_slug, fall back to
  -- the raw input if no event found (so the call doesn't silently fail —
  -- the row is still recorded, just not normalized).
  SELECT slug INTO v_slug FROM public.events
   WHERE slug = p_event_slug OR invite_slug = p_event_slug
   LIMIT 1;
  IF v_slug IS NULL THEN v_slug := p_event_slug; END IF;

  -- Don't downgrade an already-paid applicant.
  UPDATE public.applications
    SET status = 'waitlist'
    WHERE phone = v_phone
      AND event_slug = v_slug
      AND status NOT IN ('advance_paid', 'fully_paid');
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 AND NOT EXISTS (
    SELECT 1 FROM public.applications WHERE phone = v_phone AND event_slug = v_slug
  ) THEN
    INSERT INTO public.applications (event_slug, name, phone, gender, why_join, status)
    VALUES (v_slug, v_name, v_phone, '', '', 'waitlist');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.join_waitlist(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text, text, text) TO anon, authenticated;
