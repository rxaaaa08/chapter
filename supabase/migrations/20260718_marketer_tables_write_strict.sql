-- Tighten marketer-table writes from is_admin() to is_admin_strict().
--
-- is_admin() is true for ANY admin_users row, including role='ops' — so the
-- old ALL-command policies let every marketer/ops login INSERT/UPDATE/DELETE
-- call_marketers, event_marketers and marketer_sales via the anon-key REST
-- API (e.g. raise their own commission_amount, or add themselves to events).
-- The admin UI only exposes these tables to role='admin'; this brings the
-- database in line with the UI.
--
-- SELECT deliberately stays at is_admin() — reads were never the exposure,
-- and the roster/board culture is transparent by design. Nothing else breaks:
-- the marketer board is a SECURITY DEFINER RPC (get_marketer_board), and all
-- assignment/accrual trigger functions are SECURITY DEFINER, so commission
-- still accrues when a marketer (not an admin) flips a lead to fully_paid.
-- Marketer self-reads and manager scoped reads keep their existing policies.

-- ── call_marketers ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS call_marketers_admin_all ON public.call_marketers;

CREATE POLICY call_marketers_admin_select ON public.call_marketers
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY call_marketers_admin_insert ON public.call_marketers
  FOR INSERT TO authenticated WITH CHECK (is_admin_strict());
CREATE POLICY call_marketers_admin_update ON public.call_marketers
  FOR UPDATE TO authenticated USING (is_admin_strict()) WITH CHECK (is_admin_strict());
CREATE POLICY call_marketers_admin_delete ON public.call_marketers
  FOR DELETE TO authenticated USING (is_admin_strict());

-- ── event_marketers ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS event_marketers_admin_all ON public.event_marketers;

CREATE POLICY event_marketers_admin_select ON public.event_marketers
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY event_marketers_admin_insert ON public.event_marketers
  FOR INSERT TO authenticated WITH CHECK (is_admin_strict());
CREATE POLICY event_marketers_admin_update ON public.event_marketers
  FOR UPDATE TO authenticated USING (is_admin_strict()) WITH CHECK (is_admin_strict());
CREATE POLICY event_marketers_admin_delete ON public.event_marketers
  FOR DELETE TO authenticated USING (is_admin_strict());

-- ── marketer_sales (append-only ledger — inserts come from the SECURITY
--    DEFINER accrual trigger; humans should never write it, but admin keeps
--    the ability for manual corrections) ───────────────────────────────────
DROP POLICY IF EXISTS marketer_sales_admin_all ON public.marketer_sales;

CREATE POLICY marketer_sales_admin_select ON public.marketer_sales
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY marketer_sales_admin_insert ON public.marketer_sales
  FOR INSERT TO authenticated WITH CHECK (is_admin_strict());
CREATE POLICY marketer_sales_admin_update ON public.marketer_sales
  FOR UPDATE TO authenticated USING (is_admin_strict()) WITH CHECK (is_admin_strict());
CREATE POLICY marketer_sales_admin_delete ON public.marketer_sales
  FOR DELETE TO authenticated USING (is_admin_strict());
