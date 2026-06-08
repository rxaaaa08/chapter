-- C5: Lock the remaining admin tables.
--
-- Current state before this migration is dangerous:
--   * applications  — anon SELECT/INSERT/UPDATE all wide open. An
--     attacker can mark someone else's application as advance_paid or
--     fully_paid via a plain REST PATCH using the public anon key.
--   * payu_payments — the only policy is "Service role full access"
--     but with roles=PUBLIC, so it actually grants * to anyone. PII
--     (name, phone, email, amount, mihpayid) is scrapable.
--   * events / event_dates / event_media / event_reviews / faqs /
--     chat_messages — every "Admin write" policy is roles=PUBLIC, so
--     anyone with the anon key can create/edit/delete events, dates,
--     reviews, FAQs, and chat templates. Easy site defacement.
--   * invited_numbers — anon can SELECT, INSERT, DELETE. An attacker
--     can add their own phone to bypass the invite-only PayU guard
--     introduced in C1, or delete genuine invites.
--   * invite_payment_submissions — anon RW. Attacker can mark
--     themselves "fully_paid".
--   * flow_analytics — anon SELECT exposes which cities/events the
--     audience is browsing (moderate PII).
--   * admin_users — authenticated SELECT is wide; anyone signed in
--     via Google can enumerate admin emails.
--   * admin_push_subscriptions — single "allow all" policy with
--     roles=PUBLIC grants every command to anyone. An attacker can
--     read admin push endpoints + auth keys (used in C3 lockdown).
--
-- Role distinction (matches the AdminPanel UI today):
--   * is_admin()         — any role in admin_users (admin or ops).
--                          Used to gate the People tab (applications,
--                          payu_payments, invite_payment_submissions
--                          reads) and the Chats/Settings tabs.
--   * is_admin_strict()  — role='admin' only. Gates the Trips, Flow
--                          and Analytics tabs (events tables, chat
--                          message templates, flow_analytics reads,
--                          invited_numbers writes).
--
-- After this migration, all anon write paths that the public site
-- still needs are explicitly preserved:
--   * applications     INSERT (apply form)            — anon allowed
--   * doubt_submissions INSERT (booking doubt form)   — anon allowed (C4)
--   * plan_doubts      INSERT (invite doubt form)     — anon allowed (C4)
--   * flow_analytics   INSERT (page-view tracking)    — anon allowed
--   * invite_payment_submissions INSERT (manual bank/UPI booking) —
--     anon allowed, but only with status='pending_verification' so
--     attackers can't fake a paid status.

-- ── 1. Add is_admin_strict() ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin_strict()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (auth.jwt() ->> 'email')
      AND role  = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_strict() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_strict() TO anon, authenticated, service_role;

-- ── 2. applications ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_select_applications"          ON public.applications;
DROP POLICY IF EXISTS "authenticated_select_applications" ON public.applications;
DROP POLICY IF EXISTS "anon can update applications"      ON public.applications;
DROP POLICY IF EXISTS "authenticated_update_applications" ON public.applications;
-- Keep both INSERT policies (anon_insert_applications, authenticated_insert_applications)
-- so the apply form keeps working from the public site.

CREATE POLICY "applications_admin_select"
  ON public.applications FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "applications_admin_update"
  ON public.applications FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── 3. payu_payments ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role full access" ON public.payu_payments;

-- Service role bypasses RLS automatically; no policy needed for it.
CREATE POLICY "payu_payments_admin_select"
  ON public.payu_payments FOR SELECT TO authenticated
  USING (is_admin());

-- ── 4. invite_payment_submissions ────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_select_invite_payment_submissions"          ON public.invite_payment_submissions;
DROP POLICY IF EXISTS "authenticated_select_invite_payment_submissions" ON public.invite_payment_submissions;
DROP POLICY IF EXISTS "anon can update invite_payment_submissions"      ON public.invite_payment_submissions;
DROP POLICY IF EXISTS "authenticated_update_invite_payment_submissions" ON public.invite_payment_submissions;
DROP POLICY IF EXISTS "anon_insert_invite_payment_submissions"          ON public.invite_payment_submissions;
DROP POLICY IF EXISTS "authenticated_insert_invite_payment_submissions" ON public.invite_payment_submissions;

-- Anon can still insert from the manual-payment fallback path in
-- AppFlow.tsx, but only with status='pending_verification' — they
-- cannot fake an already-paid status. Edge functions (service_role)
-- handle the canonical paid status writes.
CREATE POLICY "invite_payment_submissions_anon_insert_pending"
  ON public.invite_payment_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (status IS NULL OR status = 'pending_verification' OR status = 'pending');

CREATE POLICY "invite_payment_submissions_admin_select"
  ON public.invite_payment_submissions FOR SELECT TO authenticated
  USING (is_admin());

-- ── 5. events / event_dates / event_media / event_reviews / faqs ─────────────
--
-- These all need: public SELECT (the site renders them) + admin-strict
-- writes (only the Trips tab role). Today the "Admin write" policies
-- are roles=PUBLIC — anyone can create/edit/delete events.

DROP POLICY IF EXISTS "Admin write events"        ON public.events;
DROP POLICY IF EXISTS "Admin write event_dates"   ON public.event_dates;
DROP POLICY IF EXISTS "Admin write event_media"   ON public.event_media;
DROP POLICY IF EXISTS "Admin write event_reviews" ON public.event_reviews;
DROP POLICY IF EXISTS "Admin write faqs"          ON public.faqs;

CREATE POLICY "events_admin_write"
  ON public.events FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

CREATE POLICY "event_dates_admin_write"
  ON public.event_dates FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

CREATE POLICY "event_media_admin_write"
  ON public.event_media FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

CREATE POLICY "event_reviews_admin_write"
  ON public.event_reviews FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

CREATE POLICY "faqs_admin_write"
  ON public.faqs FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

-- Public read policies for events/dates/media/reviews/faqs already
-- exist with the correct USING expressions, so we leave them alone.

-- ── 6. chat_messages ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin write chat_messages" ON public.chat_messages;
-- Keep "public read chat_messages" / "Public read chat_messages" intact
-- so the booking flow can fetch bot message templates.

CREATE POLICY "chat_messages_admin_write"
  ON public.chat_messages FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

-- ── 7. flow_analytics ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_select" ON public.flow_analytics;
-- Keep "anon_insert" so trackEvent() in src/supabase.ts keeps working.

CREATE POLICY "flow_analytics_admin_select"
  ON public.flow_analytics FOR SELECT TO authenticated
  USING (is_admin_strict());

-- ── 8. invited_numbers ───────────────────────────────────────────────────────
--
-- Drop every anon policy. Edge functions that need to read invited_numbers
-- (e.g. create-payu-order's invite-only guard from C1) use service_role
-- and bypass RLS.

DROP POLICY IF EXISTS "anon_insert_invited_numbers"          ON public.invited_numbers;
DROP POLICY IF EXISTS "anon_delete_invited_numbers"          ON public.invited_numbers;
DROP POLICY IF EXISTS "anon_select_invited_numbers"          ON public.invited_numbers;
DROP POLICY IF EXISTS "authenticated_select_invited_numbers" ON public.invited_numbers;

CREATE POLICY "invited_numbers_admin_select"
  ON public.invited_numbers FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "invited_numbers_admin_write"
  ON public.invited_numbers FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

-- ── 9. admin_users ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_users_authenticated_read" ON public.admin_users;

-- Authenticated users can read ONLY their own row (so AdminPanel can
-- resolve their role on login). Admins-strict can read/write everyone.
CREATE POLICY "admin_users_self_read"
  ON public.admin_users FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "admin_users_admin_read_all"
  ON public.admin_users FOR SELECT TO authenticated
  USING (is_admin_strict());

CREATE POLICY "admin_users_admin_write"
  ON public.admin_users FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

-- ── 10. admin_push_subscriptions ─────────────────────────────────────────────
--
-- Each admin/ops user manages their own push subscription. The
-- send-admin-push edge function uses service_role to read all rows
-- for broadcast.

DROP POLICY IF EXISTS "allow all for admin_push_subscriptions" ON public.admin_push_subscriptions;

CREATE POLICY "admin_push_subscriptions_admin_select"
  ON public.admin_push_subscriptions FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "admin_push_subscriptions_admin_write"
  ON public.admin_push_subscriptions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
