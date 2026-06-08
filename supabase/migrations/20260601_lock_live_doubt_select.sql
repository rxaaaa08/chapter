-- C4 patch: doubt_submissions + plan_doubts had RLS=true but with
-- SELECT policies set to USING true for both anon and authenticated
-- roles. Anyone with the anon key could read every customer's name,
-- phone, and doubt message. Verified leaking real PII via REST.
--
-- Strategy:
--   * Drop the wide-open SELECT policies.
--   * Add admin-only SELECT via is_admin() (introduced in the previous
--     migration).
--   * INSERT policies stay as-is so the booking + invite flow doubt
--     forms keep submitting.
--
-- After this:
--   * Anon SELECT  → empty array
--   * Anon INSERT  → still works (form submissions)
--   * Admin SELECT (via Google JWT in admin_users) → full read
--   * service_role  → full bypass

-- ── doubt_submissions ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_select"                       ON public.doubt_submissions;
DROP POLICY IF EXISTS "authenticated can select doubts"   ON public.doubt_submissions;

CREATE POLICY "doubt_submissions_admin_select"
  ON public.doubt_submissions
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ── plan_doubts ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon can read doubts"              ON public.plan_doubts;
DROP POLICY IF EXISTS "authenticated can read doubts"     ON public.plan_doubts;

CREATE POLICY "plan_doubts_admin_select"
  ON public.plan_doubts
  FOR SELECT
  TO authenticated
  USING (is_admin());
