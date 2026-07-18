-- Dual-role (marketer + manager) support, found while designing the
-- "My Leads / Team Leads" scope switch:
--
-- Managers had SELECT + UPDATE on applications but no INSERT — so a manager
-- approving a doubt (which creates the application row) hit an RLS wall:
-- applications_admin_insert needs is_admin_only(), applications_marketer_insert
-- only allows SELF-assigned rows, and the anon policy requires status
-- 'pending'. This also forced the doubt-approval code to self-assign, which
-- for a dual-role manager approving a TEAMMATE's doubt would steal the lead
-- (and its ₹50 commission) from the teammate.
--
-- Fix: managers may INSERT application rows on their own events with any
-- marketer attribution — pairing with the client change that now prefers the
-- doubt's existing owner over the approver.

DROP POLICY IF EXISTS applications_manager_insert ON public.applications;
CREATE POLICY applications_manager_insert ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (current_manager_id() IS NOT NULL AND is_event_manager(event_slug));
