-- Security hardening: make open-event OTP verification atomic so the 5-attempt
-- cap cannot be outrun by a flood of concurrent guesses.
--
-- Before this, the edge function did read-attempts → compare-code → increment as
-- three separate steps. Thousands of simultaneous verify requests could each read
-- "attempts < 5" and get a real code comparison BEFORE any increment landed,
-- effectively giving unlimited guesses against a 6-digit code in a single burst.
--
-- This function does the whole thing inside one row-locked transaction
-- (SELECT ... FOR UPDATE), so concurrent verifies on the same session serialize
-- and the attempt counter is authoritative. The edge function computes the hash
-- (sha256(token:code)) and passes it in — no secret leaves the function.

CREATE OR REPLACE FUNCTION public.verify_open_event_otp(
  p_token         text,
  p_expected_hash text,
  p_event_slug    text,
  p_phone         text,
  p_email         text,
  p_max_attempts  int
) RETURNS TABLE (status text, remaining int)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  s public.open_event_otp_sessions%ROWTYPE;
BEGIN
  -- Row lock: any other verify for this same token blocks here until we commit,
  -- so the attempt count below is always current and can never be raced past.
  SELECT * INTO s
  FROM public.open_event_otp_sessions
  WHERE verification_token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text, 0; RETURN;
  END IF;

  IF s.event_slug <> p_event_slug OR s.phone <> p_phone OR s.email <> p_email THEN
    RETURN QUERY SELECT 'mismatch'::text, 0; RETURN;
  END IF;

  IF s.expires_at <= now() THEN
    RETURN QUERY SELECT 'expired'::text, 0; RETURN;
  END IF;

  -- Idempotent success: a session already verified stays verified.
  IF s.verified_at IS NOT NULL THEN
    RETURN QUERY SELECT 'already_verified'::text, 0; RETURN;
  END IF;

  IF s.attempts >= p_max_attempts THEN
    RETURN QUERY SELECT 'exhausted'::text, 0; RETURN;
  END IF;

  IF s.code_hash = p_expected_hash THEN
    UPDATE public.open_event_otp_sessions
      SET verified_at = now(), updated_at = now()
      WHERE id = s.id;
    RETURN QUERY SELECT 'verified'::text, 0; RETURN;
  END IF;

  -- Wrong code: burn one attempt.
  UPDATE public.open_event_otp_sessions
    SET attempts = attempts + 1, updated_at = now()
    WHERE id = s.id;

  IF (s.attempts + 1) >= p_max_attempts THEN
    RETURN QUERY SELECT 'exhausted'::text, 0; RETURN;
  END IF;

  RETURN QUERY SELECT 'wrong'::text, (p_max_attempts - s.attempts - 1); RETURN;
END;
$$;

-- Only service_role (edge functions) may call this. anon/authenticated cannot.
REVOKE EXECUTE ON FUNCTION
  public.verify_open_event_otp(text, text, text, text, text, int)
  FROM PUBLIC, anon, authenticated;
