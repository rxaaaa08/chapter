-- Anon needs to RECORD bill-opens (for cart-abandonment) but must NOT be able
-- to READ bill_opens (privacy: phones/names). A client-side .upsert() compiles
-- to INSERT ... ON CONFLICT, which requires a SELECT RLS policy to check the
-- conflict — anon has none (admin-only SELECT), so the upsert was silently
-- failing and no bill-opens were recorded after RLS was enabled (the cause of
-- cart-abandonment never firing).
--
-- This SECURITY DEFINER function does the upsert with the owner's privileges
-- (bypassing RLS) so anon can record a bill-open via RPC without being granted
-- any read access to the table.
CREATE OR REPLACE FUNCTION public.record_bill_open(
  p_phone       text,
  p_name        text,
  p_event_slug  text,
  p_event_title text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
BEGIN
  v_phone := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  IF length(v_phone) <> 10 THEN RETURN; END IF;
  IF coalesce(p_event_slug, '') = '' THEN RETURN; END IF;

  INSERT INTO public.bill_opens (phone, name, event_slug, event_title, opened_at)
  VALUES (v_phone, NULLIF(p_name, ''), p_event_slug, NULLIF(p_event_title, ''), now())
  ON CONFLICT (phone, event_slug)
  DO UPDATE SET opened_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_bill_open(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_bill_open(text, text, text, text) TO anon, authenticated;
