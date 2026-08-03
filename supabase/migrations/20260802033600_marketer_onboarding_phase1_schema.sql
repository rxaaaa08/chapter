-- Marketer self-serve onboarding — Phase 1 schema.
--
-- This migration establishes the database trust boundary before any public UI
-- exists. The browser may save only its own in-progress training row. Creating
-- panel access remains a server-only, atomic operation through enroll_marketer.

-- ── Training progress ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.marketer_signups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text UNIQUE NOT NULL,
  name           text,
  phone          text,
  upi_id         text,
  progress       jsonb NOT NULL DEFAULT '{}'::jsonb,
  quiz_passed_at timestamptz,
  agreed_at      timestamptz,
  status         text NOT NULL DEFAULT 'in_progress'
                   CHECK (status IN ('in_progress', 'enrolled')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.marketer_signups.progress IS
  'Onboarding state: current_level, completed, retries, answers, test_application, and level_timestamps.';

ALTER TABLE public.marketer_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketer_signups_select ON public.marketer_signups;
CREATE POLICY marketer_signups_select ON public.marketer_signups
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin_strict())
    OR email = lower(coalesce((SELECT auth.jwt()) ->> 'email', ''))
  );

DROP POLICY IF EXISTS marketer_signups_insert ON public.marketer_signups;
CREATE POLICY marketer_signups_insert ON public.marketer_signups
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin_strict())
    OR (
      email = lower(coalesce((SELECT auth.jwt()) ->> 'email', ''))
      AND status = 'in_progress'
    )
  );

DROP POLICY IF EXISTS marketer_signups_update ON public.marketer_signups;
CREATE POLICY marketer_signups_update ON public.marketer_signups
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_admin_strict())
    OR email = lower(coalesce((SELECT auth.jwt()) ->> 'email', ''))
  )
  WITH CHECK (
    (SELECT public.is_admin_strict())
    OR (
      email = lower(coalesce((SELECT auth.jwt()) ->> 'email', ''))
      AND status = 'in_progress'
    )
  );

DROP POLICY IF EXISTS marketer_signups_delete ON public.marketer_signups;
CREATE POLICY marketer_signups_delete ON public.marketer_signups
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_strict()));

-- Grants and RLS are separate layers. Keep the table unreachable to anon, give
-- signed-in users only the operations that have policies, and retain trusted
-- server access for the signup edge function.
REVOKE ALL ON TABLE public.marketer_signups FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.marketer_signups TO authenticated;
GRANT ALL ON TABLE public.marketer_signups TO service_role;

-- ── Marketer roster additions ───────────────────────────────────────────────

ALTER TABLE public.call_marketers
  ADD COLUMN IF NOT EXISTS upi_id      text,
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Everyone already on the roster was hand-added and must not appear as NEW.
-- Future self-enrolled rows deliberately leave reviewed_at NULL.
UPDATE public.call_marketers
   SET reviewed_at = now()
 WHERE reviewed_at IS NULL
   AND created_at < timestamptz '2026-08-02 00:00:00+05:30';

-- ── Atomic enrollment trust boundary ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enroll_marketer(
  p_email text,
  p_name  text,
  p_phone text,
  p_upi   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email         text := lower(trim(p_email));
  v_existing_role text;
  v_marketer      public.call_marketers%ROWTYPE;
BEGIN
  -- Never attach the marketer side-car to a founder/admin login. Doing so
  -- changes their RLS identity and can silently remove their all-leads view.
  SELECT au.role
    INTO v_existing_role
    FROM public.admin_users au
   WHERE lower(au.email) = v_email;

  IF v_existing_role = 'admin' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_email');
  END IF;

  SELECT cm.*
    INTO v_marketer
    FROM public.call_marketers cm
   WHERE lower(cm.email) = v_email;

  IF FOUND THEN
    -- Never restore panel login for an inactive marketer. An inactive side-car
    -- is invisible to current_marketer_id(); pairing it with an ops login would
    -- create a plain-ops user who can see every lead.
    IF NOT v_marketer.active THEN
      RETURN jsonb_build_object('ok', false, 'error', 'inactive_marketer');
    END IF;

    -- Active retries are idempotent, and this also heals a historical active
    -- marketer that is missing only the ops login row.
    INSERT INTO public.admin_users (email, role)
    VALUES (v_email, 'ops')
    ON CONFLICT (email) DO NOTHING;

    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  -- A Postgres function call is one transaction: if either insert fails, both
  -- roll back. This prevents the dangerous admin_users-only half-state.
  INSERT INTO public.call_marketers
    (email, name, phone, upi_id, active, reviewed_at)
  VALUES
    (v_email, p_name, p_phone, p_upi, true, NULL);

  INSERT INTO public.admin_users (email, role)
  VALUES (v_email, 'ops')
  ON CONFLICT (email) DO NOTHING;

  UPDATE public.marketer_signups
     SET status = 'enrolled',
         updated_at = now()
   WHERE email = v_email;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_marketer(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enroll_marketer(text, text, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_marketer(text, text, text, text) TO service_role;

-- ── Conversion funnel ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.marketer_signup_intents (
  email         text PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

ALTER TABLE public.marketer_signup_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketer_signup_intents_admin_read ON public.marketer_signup_intents;
CREATE POLICY marketer_signup_intents_admin_read ON public.marketer_signup_intents
  FOR SELECT TO authenticated
  USING (public.is_admin_strict());

REVOKE ALL ON TABLE public.marketer_signup_intents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.marketer_signup_intents TO authenticated;
GRANT ALL ON TABLE public.marketer_signup_intents TO service_role;

-- Called by the signed-in /marketer surface. The email is always taken from
-- the verified JWT, never from a caller-controlled function argument.
CREATE OR REPLACE FUNCTION public.record_marketer_signup_intent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF v_email = '' THEN
    RETURN;
  END IF;

  INSERT INTO public.marketer_signup_intents (email)
  VALUES (v_email)
  ON CONFLICT (email) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.record_marketer_signup_intent() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_marketer_signup_intent() FROM anon;
GRANT EXECUTE ON FUNCTION public.record_marketer_signup_intent() TO authenticated;

-- Preserve completion even if a marketer is later deleted/off-boarded. The
-- trigger covers both self-serve enrollment and founder-added marketers.
CREATE OR REPLACE FUNCTION public.stamp_marketer_signup_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.marketer_signup_intents (email, completed_at)
  VALUES (lower(NEW.email), now())
  ON CONFLICT (email)
  DO UPDATE
     SET completed_at = coalesce(
       public.marketer_signup_intents.completed_at,
       excluded.completed_at
     );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stamp_marketer_signup_completion() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stamp_marketer_signup_completion() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_stamp_marketer_signup_completion ON public.call_marketers;
CREATE TRIGGER trg_stamp_marketer_signup_completion
  AFTER INSERT ON public.call_marketers
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_marketer_signup_completion();

-- Every marketer already on the roster completed the funnel before tracking
-- existed. Their roster timestamp is the best available start/completion time.
INSERT INTO public.marketer_signup_intents (email, first_seen_at, completed_at)
SELECT lower(cm.email), cm.created_at, cm.created_at
  FROM public.call_marketers cm
ON CONFLICT (email)
DO UPDATE
   SET completed_at = coalesce(
     public.marketer_signup_intents.completed_at,
     excluded.completed_at
   );
