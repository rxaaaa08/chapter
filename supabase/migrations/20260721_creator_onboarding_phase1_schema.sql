-- ─────────────────────────────────────────────────────────────────────────────
-- CREATOR self-serve onboarding — Phase 1 schema
-- (proposal: creator-self-serve-onboarding-proposal.md §11)
--
-- Additive, non-destructive columns on the existing affiliates roster so creators
-- can onboard themselves:
--   • upi_id  — payout destination. Today there is NOWHERE to record how a creator
--               is actually paid; the founder tracks what is owed (affiliate_sales)
--               but not where to send it. Collected at signup.
--   • phone   — optional contact number (unverified; signup identity comes from the
--               Google login, so there is no phone OTP).
--   • reviewed_at — the "new arrivals" flag. NULL = self-joined and not yet eyeballed
--               by the founder; a timestamp = reviewed. New self-serve inserts leave
--               it NULL (they surface as "NEW" in the admin Creators list); the 14
--               existing hand-entered creators are back-filled so they are NOT shown
--               as new. Review is optional and after-the-fact — never a signup gate.
--
-- Auto-activate model: self-serve rows are created active=true (link + dashboard
-- work instantly). This is safe because commission only accrues on a real
-- fully_paid booking on an affiliate_enabled event — a fake/idle creator earns ₹0.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS upi_id      text,
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Back-fill existing creators as already-reviewed (they were hand-added by the
-- founder). Uses created_at so the timestamp is truthful, not "now". Idempotent:
-- only touches rows still NULL, so re-running never clobbers a real review time.
UPDATE public.affiliates
   SET reviewed_at = created_at
 WHERE reviewed_at IS NULL;

-- ── handle_available(text) ───────────────────────────────────────────────────
-- The onboarding page needs a live "is @handle free?" check, but anon must not be
-- able to read the affiliates table (it holds every creator's email). SECURITY
-- DEFINER RPC returns only a boolean, never row data. Applies the same
-- normalisation + format rule as the affiliates_handle_format CHECK so the answer
-- matches what an insert would actually accept.
CREATE OR REPLACE FUNCTION public.handle_available(p_handle text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- must be a valid handle shape…
    lower(coalesce(p_handle, '')) ~ '^[a-z0-9._]{1,40}$'
    -- …and not already taken (case-insensitive, matching the lowercased store).
    AND NOT EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.handle = lower(p_handle)
    );
$$;

REVOKE ALL ON FUNCTION public.handle_available(text) FROM public;
GRANT EXECUTE ON FUNCTION public.handle_available(text) TO anon, authenticated;
