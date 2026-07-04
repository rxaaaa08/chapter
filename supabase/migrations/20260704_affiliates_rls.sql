-- ─────────────────────────────────────────────────────────────────────────────
-- AFFILIATE (creator) links — RLS
--
-- Creators are authenticated (Google) users who are NOT in admin_users, so
-- is_admin() is false for them and every RLS-locked customer table stays
-- invisible. Their only reach is their OWN affiliate row, sales and clicks;
-- cross-creator data (the leaderboard) is exposed via the SECURITY DEFINER
-- affiliate_leaderboard() RPC, never a broad table grant.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── affiliates: admin full, creator reads own row ──
CREATE POLICY affiliates_admin_all ON public.affiliates
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY affiliates_self_select ON public.affiliates
  FOR SELECT TO authenticated
  USING (id = current_affiliate_id());

-- ── affiliate_sales: admin full, creator reads own sales ──
CREATE POLICY affiliate_sales_admin_all ON public.affiliate_sales
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY affiliate_sales_self_select ON public.affiliate_sales
  FOR SELECT TO authenticated
  USING (affiliate_id = current_affiliate_id());

-- ── affiliate_clicks: admin full, creator reads own clicks ──
CREATE POLICY affiliate_clicks_admin_all ON public.affiliate_clicks
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY affiliate_clicks_self_select ON public.affiliate_clicks
  FOR SELECT TO authenticated
  USING (affiliate_id = current_affiliate_id());
