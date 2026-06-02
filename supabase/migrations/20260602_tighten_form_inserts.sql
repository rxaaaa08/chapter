-- Tighten WITH CHECK on anonymous form INSERT policies.
--
-- Before this migration, anon could INSERT arbitrary rows into the four
-- public form tables — any-length name, any string in phone, any value
-- in status. With H1 rate-limit triggers in place an attacker can't spam
-- millions of rows, but they could still poison individual records with
-- garbage (e.g., a 10MB "name" field, a status='advance_paid' on a fake
-- application).
--
-- After this migration:
--   * phone must be exactly 10 digits (matches our client-side normalization)
--   * name must be 1-80 chars (matches sanitizeName() in create-payu-order)
--   * applications.status from anon must be 'pending' only — admins and
--     edge functions (service_role) bypass RLS and can set other values
--
-- Service role (edge functions) always bypasses RLS, so payu-callback
-- updates and admin panel writes are unaffected.

-- ── applications ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_insert_applications"          ON public.applications;
DROP POLICY IF EXISTS "authenticated_insert_applications" ON public.applications;

CREATE POLICY "applications_anon_insert"
  ON public.applications FOR INSERT TO anon, authenticated
  WITH CHECK (
    phone ~ '^[0-9]{10}$'
    AND char_length(name) BETWEEN 1 AND 80
    AND char_length(event_slug) BETWEEN 1 AND 120
    AND char_length(why_join) <= 1000
    AND status = 'pending'
  );

-- ── doubt_submissions ────────────────────────────────────────────────────────
-- name + phone are nullable here (the doubt form may not collect both).

DROP POLICY IF EXISTS "anon_insert"                       ON public.doubt_submissions;
DROP POLICY IF EXISTS "authenticated can insert doubts"   ON public.doubt_submissions;

CREATE POLICY "doubt_submissions_anon_insert"
  ON public.doubt_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (
    (phone IS NULL OR phone ~ '^[0-9]{10}$')
    AND (name  IS NULL OR char_length(name)  BETWEEN 1 AND 80)
    AND (doubt IS NULL OR char_length(doubt) <= 2000)
    AND (event_title IS NULL OR char_length(event_title) <= 200)
  );

-- ── plan_doubts ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon can insert doubts"           ON public.plan_doubts;
DROP POLICY IF EXISTS "authenticated can insert doubts"  ON public.plan_doubts;

CREATE POLICY "plan_doubts_anon_insert"
  ON public.plan_doubts FOR INSERT TO anon, authenticated
  WITH CHECK (
    phone ~ '^[0-9]{10}$'
    AND char_length(event_slug) BETWEEN 1 AND 120
    AND char_length(message)    BETWEEN 1 AND 2000
    AND (status IS NULL OR status IN ('new', 'open', 'pending', 'resolved'))
  );

-- ── invite_payment_submissions ───────────────────────────────────────────────
-- Existing policy already restricts status; add the rest.

DROP POLICY IF EXISTS "invite_payment_submissions_anon_insert_pending" ON public.invite_payment_submissions;

CREATE POLICY "invite_payment_submissions_anon_insert"
  ON public.invite_payment_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (
    (status IS NULL OR status = 'pending' OR status = 'pending_verification')
    AND (phone IS NULL OR phone ~ '^[0-9]{10}$')
    AND (name  IS NULL OR char_length(name) BETWEEN 1 AND 80)
  );
