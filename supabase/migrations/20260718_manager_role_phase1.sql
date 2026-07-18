-- Manager role — Phase 1: foundations (tables, helpers, RLS read/update scope).
-- See manager-role-proposal.md. A "manager" is an ops login whose email is also
-- in public.managers (same side-car pattern as call_marketers). Managers own
-- whole events (event_managers) and oversee that event's marketers; they see
-- ALL leads of their events, unlike marketers who see only their own.
--
-- The one behavioural change to existing roles: is_admin_only() gains a third
-- branch so a manager is NOT treated as a mini-admin. Without it, any ops user
-- not in call_marketers passes is_admin_only() and sees every lead of every
-- event. Plain ops users (in neither side-car) keep that broad view unchanged.

-- ── Tables ────────────────────────────────────────────────────────────────

-- Manager roster. Identity = JWT email matched against admin_users ('ops'
-- role gate), same as call_marketers. commission_amount is ₹ per fully-paid
-- ticket on their events (default ₹35, founder-confirmed 2026-07-18).
CREATE TABLE IF NOT EXISTS public.managers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text UNIQUE NOT NULL,
  name              text NOT NULL,
  commission_amount numeric(10,2) NOT NULL DEFAULT 35,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- Which manager covers which event. Usually one manager per event; the shape
-- allows two for handover weeks. Admin manages this (managers cannot).
CREATE TABLE IF NOT EXISTS public.event_managers (
  event_slug  text NOT NULL,
  manager_id  uuid NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_slug, manager_id)
);
CREATE INDEX IF NOT EXISTS idx_event_managers_manager ON public.event_managers(manager_id);
ALTER TABLE public.event_managers ENABLE ROW LEVEL SECURITY;

-- Append-only manager commission ledger (accrual trigger lands in Phase 5).
-- paid_out_at mirrors affiliate_sales so the Performance card can show
-- earned vs unpaid and mark payouts.
CREATE TABLE IF NOT EXISTS public.manager_sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  manager_id      uuid NOT NULL REFERENCES public.managers(id) ON DELETE RESTRICT,
  amount          numeric(10,2) NOT NULL,
  accrued_at      timestamptz NOT NULL DEFAULT now(),
  paid_out_at     timestamptz,
  UNIQUE (application_id)
);
CREATE INDEX IF NOT EXISTS idx_manager_sales_manager ON public.manager_sales(manager_id);
ALTER TABLE public.manager_sales ENABLE ROW LEVEL SECURITY;

-- ── Helpers ───────────────────────────────────────────────────────────────

-- JWT email → managers.id (active only), else NULL. Sibling of
-- current_marketer_id(); the basis of all manager-scoped RLS.
CREATE OR REPLACE FUNCTION public.current_manager_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM managers
  WHERE email = (auth.jwt() ->> 'email')
    AND active = true
$$;

-- True when the logged-in user is an active manager of the given event.
-- SECURITY DEFINER so policies on other tables can use it without nesting
-- through event_managers' own RLS.
CREATE OR REPLACE FUNCTION public.is_event_manager(p_event_slug text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_managers
    WHERE manager_id = current_manager_id()
      AND event_slug = p_event_slug
  )
$$;

-- True when the given application belongs to one of the caller's managed
-- events. Lets marketer_sales RLS scope by event without re-entering the
-- applications table's own RLS.
CREATE OR REPLACE FUNCTION public.manager_owns_application(p_application_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM applications a
    WHERE a.id = p_application_id
      AND is_event_manager(a.event_slug)
  )
$$;

-- THE behavioural change: admins-who-are-neither-marketer-nor-manager. Keeps
-- managers out of the mini-admin path (all leads / all doubts / fixed_costs /
-- push-subscription deletes). Plain ops users are unaffected.
CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT is_admin()
     AND current_marketer_id() IS NULL
     AND current_manager_id() IS NULL
$$;

-- ── RLS: the three new tables ─────────────────────────────────────────────
-- Deliberately is_admin_strict() (role='admin' only) for writes, NOT the
-- broader is_admin() the marketer tables use — ops users have no business
-- editing rosters or ledgers. Managers read their own rows.

DROP POLICY IF EXISTS managers_admin_all ON public.managers;
CREATE POLICY managers_admin_all ON public.managers
  FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

DROP POLICY IF EXISTS managers_self_select ON public.managers;
CREATE POLICY managers_self_select ON public.managers
  FOR SELECT TO authenticated
  USING (id = current_manager_id());

DROP POLICY IF EXISTS event_managers_admin_all ON public.event_managers;
CREATE POLICY event_managers_admin_all ON public.event_managers
  FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

DROP POLICY IF EXISTS event_managers_self_select ON public.event_managers;
CREATE POLICY event_managers_self_select ON public.event_managers
  FOR SELECT TO authenticated
  USING (manager_id = current_manager_id());

DROP POLICY IF EXISTS manager_sales_admin_all ON public.manager_sales;
CREATE POLICY manager_sales_admin_all ON public.manager_sales
  FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

DROP POLICY IF EXISTS manager_sales_self_select ON public.manager_sales;
CREATE POLICY manager_sales_self_select ON public.manager_sales
  FOR SELECT TO authenticated
  USING (manager_id = current_manager_id());

-- ── RLS: manager scope on existing tables ─────────────────────────────────

-- Leads: managers see and work EVERY lead of their events (marketer-name
-- tagging happens client-side). WITH CHECK repeats the event scope so a
-- manager cannot move a lead onto an event they don't manage.
DROP POLICY IF EXISTS applications_manager_select ON public.applications;
CREATE POLICY applications_manager_select ON public.applications
  FOR SELECT TO authenticated
  USING (current_manager_id() IS NOT NULL AND is_event_manager(event_slug));

DROP POLICY IF EXISTS applications_manager_update ON public.applications;
CREATE POLICY applications_manager_update ON public.applications
  FOR UPDATE TO authenticated
  USING (current_manager_id() IS NOT NULL AND is_event_manager(event_slug))
  WITH CHECK (current_manager_id() IS NOT NULL AND is_event_manager(event_slug));

-- Doubts: the escalation queue. doubt_submissions has no event_slug — only
-- event_title — so scope through the existing resolve_event_slug() helper
-- (same one the assignment triggers use). Unresolvable titles stay invisible
-- to managers, matching how they stay unassigned to marketers.
DROP POLICY IF EXISTS doubt_submissions_manager_select ON public.doubt_submissions;
CREATE POLICY doubt_submissions_manager_select ON public.doubt_submissions
  FOR SELECT TO authenticated
  USING (current_manager_id() IS NOT NULL
         AND is_event_manager(resolve_event_slug(event_title)));

DROP POLICY IF EXISTS doubt_submissions_manager_update ON public.doubt_submissions;
CREATE POLICY doubt_submissions_manager_update ON public.doubt_submissions
  FOR UPDATE TO authenticated
  USING (current_manager_id() IS NOT NULL
         AND is_event_manager(resolve_event_slug(event_title)))
  WITH CHECK (current_manager_id() IS NOT NULL
              AND is_event_manager(resolve_event_slug(event_title)));

-- Marketer roster: managers read the whole roster (needed to pick who to
-- assign in Phase 3, and to name-tag leads). Read-only — no commission edits.
DROP POLICY IF EXISTS call_marketers_manager_select ON public.call_marketers;
CREATE POLICY call_marketers_manager_select ON public.call_marketers
  FOR SELECT TO authenticated
  USING (current_manager_id() IS NOT NULL);

-- Which marketers are on their events (write access arrives in Phase 3).
DROP POLICY IF EXISTS event_marketers_manager_select ON public.event_marketers;
CREATE POLICY event_marketers_manager_select ON public.event_marketers
  FOR SELECT TO authenticated
  USING (current_manager_id() IS NOT NULL AND is_event_manager(event_slug));

-- Marketer commission ledger, scoped to sales on their events — powers the
-- manager's marketer-ROI view.
DROP POLICY IF EXISTS marketer_sales_manager_select ON public.marketer_sales;
CREATE POLICY marketer_sales_manager_select ON public.marketer_sales
  FOR SELECT TO authenticated
  USING (current_manager_id() IS NOT NULL AND manager_owns_application(application_id));

-- Their events, even when inactive (public read only covers is_active=true).
DROP POLICY IF EXISTS events_manager_select ON public.events;
CREATE POLICY events_manager_select ON public.events
  FOR SELECT TO authenticated
  USING (current_manager_id() IS NOT NULL AND is_event_manager(slug));
