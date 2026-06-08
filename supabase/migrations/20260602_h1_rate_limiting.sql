-- H1: Rate limiting for public endpoints + form submission paths.
--
-- Two layers:
--   1. rate_limits table + check_rate_limit(...) function. Edge functions
--      (create-payu-order, send-aisensy-invite) call this directly with
--      service_role.
--   2. BEFORE INSERT triggers on the 4 anon-writable form tables
--      (applications, doubt_submissions, plan_doubts, invite_payment_submissions)
--      using the same backend. Triggers bypass for service_role and is_admin().
--
-- Limits are conservative — they should never bother a real user who's
-- submitting one application per booking, but they cap obvious abuse:
--   * create-payu-order: 10/min/IP, 5/hour/phone
--   * send-aisensy-invite: 30/hour/admin (per email)
--   * form INSERT triggers: 30/min/IP, 10/hour/phone

-- ── 1. Storage table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text          NOT NULL,
  key         text          NOT NULL,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON public.rate_limits(kind, key, created_at DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies → only service_role (bypasses RLS) and our own SECURITY DEFINER
-- functions can touch this table.

-- ── 2. check_rate_limit(kind, key, window_seconds, max_requests) → bool ─────
--
-- Returns TRUE if the request is allowed (and inserts a row); FALSE if
-- the caller has exceeded max_requests in the window.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_kind            text,
  p_key             text,
  p_window_seconds  int,
  p_max_requests    int
) RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  current_count int;
BEGIN
  -- Opportunistic cleanup: 1% chance per call deletes rows >1 day old.
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 day';
  END IF;

  SELECT count(*) INTO current_count
  FROM public.rate_limits
  WHERE kind = p_kind
    AND key  = p_key
    AND created_at > now() - (p_window_seconds || ' seconds')::interval;

  IF current_count >= p_max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (kind, key) VALUES (p_kind, p_key);
  RETURN true;
END;
$$;

-- Only service_role + our trigger functions need this. anon/auth can't reach it.
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) FROM PUBLIC, anon, authenticated;

-- ── 3. Trigger function for anon INSERTs on public form tables ──────────────

CREATE OR REPLACE FUNCTION public.rate_limit_anon_insert()
RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  caller_role  text;
  ip           text;
  phone_val    text;
  ok           boolean;
BEGIN
  caller_role := current_setting('role', true);

  -- Service role (edge functions) bypasses entirely.
  IF caller_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admin panel inserts (e.g. application_create_from_doubt) bypass too.
  -- is_admin() checks JWT email against admin_users.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Client IP: prefer first hop of x-forwarded-for, fall back to x-real-ip.
  ip := btrim(split_part(
    COALESCE(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      current_setting('request.headers', true)::json->>'x-real-ip',
      'unknown'
    ),
    ',', 1
  ));

  -- 30 inserts/min per IP — lenient enough that shared Wi-Fi / family
  -- networks won't hit it.
  SELECT public.check_rate_limit(TG_TABLE_NAME || ':ip', ip, 60, 30) INTO ok;
  IF NOT ok THEN
    -- PostgREST maps SQLSTATE 'PT429' to HTTP 429 Too Many Requests.
    RAISE EXCEPTION 'rate limit exceeded (ip)' USING ERRCODE = 'PT429';
  END IF;

  -- Per-phone: only fires on tables with a phone column.
  BEGIN
    phone_val := NEW.phone;
    IF phone_val IS NOT NULL AND length(phone_val) > 0 THEN
      SELECT public.check_rate_limit(TG_TABLE_NAME || ':phone', phone_val, 3600, 10) INTO ok;
      IF NOT ok THEN
        RAISE EXCEPTION 'rate limit exceeded (phone)' USING ERRCODE = 'PT429';
      END IF;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    -- Trigger attached to a table without a 'phone' column; skip phone check.
    NULL;
  END;

  RETURN NEW;
END;
$$;

-- ── 4. Attach triggers to public form tables ────────────────────────────────

DROP TRIGGER IF EXISTS trg_rate_limit_applications ON public.applications;
CREATE TRIGGER trg_rate_limit_applications
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_anon_insert();

DROP TRIGGER IF EXISTS trg_rate_limit_doubt_submissions ON public.doubt_submissions;
CREATE TRIGGER trg_rate_limit_doubt_submissions
  BEFORE INSERT ON public.doubt_submissions
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_anon_insert();

DROP TRIGGER IF EXISTS trg_rate_limit_plan_doubts ON public.plan_doubts;
CREATE TRIGGER trg_rate_limit_plan_doubts
  BEFORE INSERT ON public.plan_doubts
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_anon_insert();

DROP TRIGGER IF EXISTS trg_rate_limit_invite_payment_submissions ON public.invite_payment_submissions;
CREATE TRIGGER trg_rate_limit_invite_payment_submissions
  BEFORE INSERT ON public.invite_payment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_anon_insert();
