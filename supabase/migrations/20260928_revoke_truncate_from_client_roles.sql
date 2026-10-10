-- Take TRUNCATE away from the two browser roles, on every public table, now
-- and for tables created later.
--
-- Why: Supabase's default grants give anon and authenticated TRUNCATE on every
-- table, and TRUNCATE ignores RLS — a role holding it empties a table no
-- matter what the policies say. The 2026-09-28 OpenClaw tracking audit flagged
-- it and a live check the same day found it on 62 public tables for anon and 63 for authenticated
-- (a few, e.g. application_events since 2026-08-08, had no such grant).
-- Result, verified the same day: 0 tables for either role; service_role
-- (edge functions) keeps TRUNCATE on all 90. The supabase_admin default ACL
-- still grants it on tables that role creates (platform-internal; not ours to
-- alter) — re-check with information_schema.role_table_grants after new tables.
-- No browser route to it was found — PostgREST has no TRUNCATE verb and no
-- public function issues one — so this is defence in depth, not a hole being
-- closed. It costs nothing: no app code, RPC or edge function truncates
-- as those roles (edge functions run as service_role, left untouched).
--
-- Only TRUNCATE is revoked; SELECT/INSERT/UPDATE/DELETE stay governed by RLS
-- exactly as before.
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Tables created by migrations (run as postgres) stop inheriting it.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
