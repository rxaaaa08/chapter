-- Let active marketers (ops) approve their own assigned doubts in the admin
-- Doubts tab. A marketer only sees doubts assigned to them (doubt_submissions
-- _marketer_select), so this stays scoped to their own leads.

-- 1. A marketer may create an application ONLY if it's assigned to themselves.
--    (Admins keep using applications_admin_insert; anon keeps status='pending'.)
create policy applications_marketer_insert on public.applications
for insert
with check (
  current_marketer_id() is not null
  and assigned_marketer_id = current_marketer_id()
);

-- 2. A marketer may whitelist a phone for the invite flow (invited_numbers),
--    needed so the approved person can enter the /invite payment flow.
create policy invited_numbers_marketer_insert on public.invited_numbers
for insert
with check (current_marketer_id() is not null);
