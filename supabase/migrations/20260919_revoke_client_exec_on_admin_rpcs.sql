-- Close two SECURITY DEFINER functions that anon/authenticated could call over REST.
--
-- Found 2026-09-19 by the Supabase security advisor. Both are internal maintenance
-- routines that were never meant to be reachable from a browser:
--
--   redistribute_event_managers(text)  re-stamps applications.assigned_manager_id on
--     every unpaid lead for an event. Manager commission is PINNED to that column at
--     lead time precisely so a late fully_paid flip cannot pay whoever happens to be
--     assigned today (that bug hit managers live on 2026-08-02). Anyone who knew an
--     event slug could scramble that pin. It guards status NOT IN
--     ('advance_paid','fully_paid','rejected'), so rows that took money were never
--     reachable.
--
--   snapshot_analytics_daily(date)  deletes a day from analytics_daily and rebuilds it.
--
-- Its sibling force_reshuffle_event_marketers() — same job, for marketers — already
-- opens with `IF NOT is_admin_strict() THEN RAISE EXCEPTION`. The manager twin simply
-- never got the same treatment. That asymmetry is what makes this an oversight rather
-- than a decision.
--
-- WHY REVOKE AND NOT AN is_admin_strict() GATE:
-- redistribute_event_managers is PERFORMed from inside two triggers,
-- event_managers_changed() and manager_active_changed(), and from purge_phone_data().
-- All three are SECURITY DEFINER owned by postgres, so the inner call carries postgres
-- privileges and a REVOKE cannot touch it. An is_admin_strict() gate WOULD break them:
-- a manager editing an event roster is not a strict admin, and the exception would roll
-- back their edit. Revoking the client roles removes the REST route and leaves every
-- legitimate caller untouched.
--
-- Verified before writing: no caller in src/ or supabase/functions/; the only cron
-- (snapshot_analytics_daily, 02:35) runs as postgres. service_role is re-granted below
-- so edge functions keep working.
--
-- REVOKE MUST NAME public. Revoking from anon and authenticated alone leaves the
-- PUBLIC grant every function is created with, and information_schema then shows zero
-- rows and looks exactly like proof. Verify with has_function_privilege, never
-- information_schema.

REVOKE ALL ON FUNCTION public.redistribute_event_managers(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redistribute_event_managers(text)
  TO service_role;

REVOKE ALL ON FUNCTION public.snapshot_analytics_daily(date)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_analytics_daily(date)
  TO service_role;
