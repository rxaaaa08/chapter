-- admin_push_subscriptions previously had a single ALL policy gated on
-- is_admin(), which returns true for ops marketers too — so an ops user could
-- delete other admins' push devices via the API (the admin panel only hid the
-- Remove button cosmetically). Split the write policy so ops can still
-- subscribe their own device (INSERT/UPDATE upsert) but only true admins
-- (is_admin_only = is_admin AND not a marketer) may DELETE a device.
DROP POLICY IF EXISTS admin_push_subscriptions_admin_write ON public.admin_push_subscriptions;

CREATE POLICY admin_push_subscriptions_insert ON public.admin_push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY admin_push_subscriptions_update ON public.admin_push_subscriptions
  FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_push_subscriptions_delete ON public.admin_push_subscriptions
  FOR DELETE TO authenticated
  USING (is_admin_only());
