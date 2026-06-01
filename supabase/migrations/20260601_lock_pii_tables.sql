-- C4: Lock down PII tables that currently have RLS disabled.
--
-- Today (before this migration):
--   doubt_conversations, doubt_messages, push_subscriptions all have
--   rowsecurity=false. The public anon key — which is committed in
--   src/supabase.ts — can SELECT * from any of them and scrape every
--   phone number, name, and chat message. This migration closes that.
--
-- Strategy:
--   * push_subscriptions  → no policies at all; only service_role can
--     touch it. The send-push-notification edge function uses service
--     role already, and no client code reads from this table.
--
--   * doubt_conversations / doubt_messages → admin-only via is_admin()
--     helper. AdminPanel's Chats tab keeps working because admin
--     users have a Google JWT whose email is in admin_users. Consumer
--     code paths that read these tables are dead (no consumer PWA)
--     and would silently return empty, which the UI handles.
--
-- The is_admin() SECURITY DEFINER helper introduced here will also be
-- used in C5 to lock the rest of the admin tables (applications,
-- payu_payments, events admin writes, etc.).

-- ── 1. is_admin() helper ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- Allow anon/auth to call the function; the function body itself runs as
-- the owner (postgres) and bypasses RLS on admin_users for the lookup.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ── 2. push_subscriptions ───────────────────────────────────────────────────

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- No policies = no anon/authenticated access. service_role bypasses RLS
-- automatically, so the send-push-notification edge function still works.

-- ── 3. doubt_conversations ──────────────────────────────────────────────────

ALTER TABLE public.doubt_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doubt_conversations_admin_select"
  ON public.doubt_conversations
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "doubt_conversations_admin_update"
  ON public.doubt_conversations
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── 4. doubt_messages ───────────────────────────────────────────────────────

ALTER TABLE public.doubt_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doubt_messages_admin_select"
  ON public.doubt_messages
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin reply path: admins can insert messages as the 'agent' sender.
CREATE POLICY "doubt_messages_admin_insert_agent"
  ON public.doubt_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() AND sender = 'agent');

CREATE POLICY "doubt_messages_admin_update"
  ON public.doubt_messages
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
