-- M5: Supabase security advisor cleanup.
--
-- Findings (from get_advisors on prod project txcmismkdttgsyhbnexf):
--   ERROR  bill_opens has RLS policies but RLS is not enabled — policies inert.
--   ERROR  push_debug_logs is public but RLS not enabled.
--   WARN   mock_payment_receipts allows anon SELECT/INSERT/UPDATE freely. The
--          only client caller (handleMockPaymentComplete in AppFlow.tsx) is
--          dead code — never invoked from the UI.
--   WARN   8 functions have role-mutable search_path (CVE-class:
--          search_path hijack from owner schema).
--   WARN   Trigger-only SECURITY DEFINER functions are RPC-callable, so anon
--          can spoof admin push notifications by POSTing to /rest/v1/rpc/...
--   WARN   rls_auto_enable (DDL event trigger) is RPC-callable.
--   WARN   log_admin_action is RPC-callable from anon, but the function body
--          rejects non-admins. Tighten by revoking anon EXECUTE so the public
--          attack surface shrinks.
--
-- Not handled here (manual / one-click in Supabase dashboard):
--   * Storage: event-images public bucket has a broad SELECT policy
--     allowing object listing. See checklist.
--   * Auth: enable "leaked password protection" toggle.

-- ── 1. bill_opens: RLS off → enable, keep existing anon INSERT/UPDATE ────────
--
-- The current allow_anon_insert_bill_opens + allow_anon_update_bill_opens
-- policies match what the upsert in App.tsx needs (insert on first open,
-- update on repeat opens). They were inert because RLS was off.

ALTER TABLE public.bill_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bill_opens_admin_select"
  ON public.bill_opens FOR SELECT TO authenticated
  USING (is_admin());

-- ── 2. push_debug_logs: RLS off → enable, service-role only ─────────────────
--
-- Only the send-push-notification edge function writes here. It uses
-- service_role which bypasses RLS, so no policies needed.

ALTER TABLE public.push_debug_logs ENABLE ROW LEVEL SECURITY;

-- ── 3. mock_payment_receipts: drop wide-open policies ───────────────────────
--
-- handleMockPaymentComplete in AppFlow.tsx is dead code — grep across
-- src/ shows no caller. Wide-open UPDATE (USING true, WITH CHECK true)
-- means anon could mark any receipt status='successful'.

DROP POLICY IF EXISTS "Allow public insert mock payment receipts"  ON public.mock_payment_receipts;
DROP POLICY IF EXISTS "Allow public read mock payment receipts"    ON public.mock_payment_receipts;
DROP POLICY IF EXISTS "Allow public upsert mock payment receipts"  ON public.mock_payment_receipts;

CREATE POLICY "mock_payment_receipts_admin_select"
  ON public.mock_payment_receipts FOR SELECT TO authenticated
  USING (is_admin());

-- ── 4. Function search_path hardening ───────────────────────────────────────

ALTER FUNCTION public.upsert_payment_submission(text, text, text, text, text, text, text, numeric, timestamptz) SET search_path = public;
ALTER FUNCTION public.sync_application_on_invite()         SET search_path = public;
ALTER FUNCTION public.trg_admin_push_new_doubt()           SET search_path = public;
ALTER FUNCTION public.trg_admin_push_new_application()     SET search_path = public;
ALTER FUNCTION public.trg_admin_push_advance_paid()        SET search_path = public;
ALTER FUNCTION public.trg_admin_push_fully_paid()          SET search_path = public;
ALTER FUNCTION public.trg_admin_push_doubt_submission()    SET search_path = public;
ALTER FUNCTION public.trg_admin_push_plan_doubt()          SET search_path = public;

-- ── 5. Lock down RPC surface ────────────────────────────────────────────────
--
-- Trigger functions are invoked by AFTER INSERT/UPDATE triggers, NOT
-- via /rest/v1/rpc. Triggers run as the table owner so they don't need
-- an EXECUTE grant for callers. Revoking from PUBLIC/anon/authenticated
-- removes the RPC attack surface (notably: spoofing admin pushes).

REVOKE EXECUTE ON FUNCTION public.trg_admin_push_new_doubt()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_admin_push_new_application()   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_admin_push_advance_paid()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_admin_push_fully_paid()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_admin_push_doubt_submission()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_admin_push_plan_doubt()        FROM PUBLIC, anon, authenticated;

-- notify_admin_push: called BY triggers via PERFORM. Owner privileges
-- run the body; revoke public to stop attacker POSTs hitting send-admin-push.
REVOKE EXECUTE ON FUNCTION public.notify_admin_push(jsonb) FROM PUBLIC, anon, authenticated;

-- sync_application_on_invite: trigger fn on invite_payment_submissions.
REVOKE EXECUTE ON FUNCTION public.sync_application_on_invite() FROM PUBLIC, anon, authenticated;

-- rls_auto_enable: DDL event trigger helper, not for runtime.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- log_admin_action: the body already rejects non-admins, but tightening
-- EXECUTE here removes the anon attack surface (less data for brute force).
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM PUBLIC, anon;
-- authenticated keeps EXECUTE so AdminPanel can call it.
