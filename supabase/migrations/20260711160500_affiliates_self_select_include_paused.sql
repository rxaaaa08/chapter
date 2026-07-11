-- Let a creator SELECT their own affiliates row even when paused.
--
-- The old self-select policy used `id = current_affiliate_id()`, and
-- current_affiliate_id() filters to `active = true`. So a paused creator's row
-- was invisible to them, which the /creator dashboard could not tell apart from
-- "email isn't a creator at all" — it showed the misleading "not a creator"
-- screen instead of the intended "your account is paused" notice.
--
-- Match by email directly (same comparison current_affiliate_id() already uses)
-- so the row is visible regardless of active. This is scoped to the affiliates
-- table only: affiliate_clicks / affiliate_sales still gate on
-- current_affiliate_id() (active-only), so a paused creator still sees no
-- clicks, sales or earnings — just their own paused status.
drop policy if exists affiliates_self_select on affiliates;
create policy affiliates_self_select on affiliates
  for select to authenticated
  using (email = (auth.jwt() ->> 'email'));
