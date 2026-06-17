-- ── applications: tighten admin policies to is_admin_only, add marketer scope ──
-- Marketers (users with a row in call_marketers) get scoped to their own
-- assigned rows. Admin-only users still see/update everything.
ALTER POLICY applications_admin_select ON public.applications
  USING (is_admin_only());

ALTER POLICY applications_admin_update ON public.applications
  USING (is_admin_only())
  WITH CHECK (is_admin_only());

ALTER POLICY applications_admin_insert ON public.applications
  WITH CHECK (is_admin_only());

CREATE POLICY applications_marketer_select ON public.applications
  FOR SELECT TO authenticated
  USING (current_marketer_id() IS NOT NULL AND assigned_marketer_id = current_marketer_id());

CREATE POLICY applications_marketer_update ON public.applications
  FOR UPDATE TO authenticated
  USING (current_marketer_id() IS NOT NULL AND assigned_marketer_id = current_marketer_id())
  WITH CHECK (current_marketer_id() IS NOT NULL AND assigned_marketer_id = current_marketer_id());

-- ── call_marketers: admin full, marketer reads own row ──
CREATE POLICY call_marketers_admin_all ON public.call_marketers
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY call_marketers_self_select ON public.call_marketers
  FOR SELECT TO authenticated
  USING (id = current_marketer_id());

-- ── event_marketers: admin full, marketer reads own membership rows ──
CREATE POLICY event_marketers_admin_all ON public.event_marketers
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY event_marketers_self_select ON public.event_marketers
  FOR SELECT TO authenticated
  USING (marketer_id = current_marketer_id());

-- ── marketer_sales: admin full, marketer reads own sales (for commission banner) ──
CREATE POLICY marketer_sales_admin_all ON public.marketer_sales
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY marketer_sales_self_select ON public.marketer_sales
  FOR SELECT TO authenticated
  USING (marketer_id = current_marketer_id());
