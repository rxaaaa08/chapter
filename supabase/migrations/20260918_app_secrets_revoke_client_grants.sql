-- app_secrets: take away the table grants nothing uses.
--
-- WHAT WAS WRONG, AND WHY IT DID NOT SHOW UP AS A BUG
-- app_secrets holds the shared secrets the DATABASE has to inject into outbound
-- calls: admin_push_secret, whatsapp_log_secret, release_log_secret,
-- purge_passcode, and since 2026-09-18 meta_alerts_secret.
--
-- It had RLS enabled with ZERO policies, which denies anon and authenticated
-- everything — so the table was, in practice, shut. But both roles still held
-- full table-level grants underneath (relacl: anon=arwdDxtm,
-- authenticated=arwdDxtm), almost certainly from Supabase's default
-- GRANT ALL ... TO anon, authenticated on the public schema.
--
-- That is one mechanism doing the work of two. RLS was the only thing standing
-- between a browser session and every secret in this table, and the day someone
-- adds a policy here for an unrelated reason — a founder-gated read, an admin
-- screen, anything — those grants wake up and the policy becomes the ONLY
-- gate. Handoff §6 makes exactly this argument about
-- meta_audience_membership, where the single mechanism is a REVOKE; here the
-- single mechanism was RLS. Same shape, opposite half missing.
--
-- WHY THIS CANNOT BREAK ANYTHING, CHECKED RATHER THAN ASSUMED (2026-09-18)
-- Every reader of this table reaches it another way:
--   * 11 SECURITY DEFINER functions, all owned by `postgres`, which also owns
--     the table — claim_email_send, log_email_send, log_email_status,
--     log_feature_release, log_whatsapp_inbound, log_whatsapp_send (x2),
--     log_whatsapp_status, notify_admin_push, purge_phone_data,
--     release_email_send. They execute as the owner, so table grants to anon
--     and authenticated are irrelevant to them. Their EXECUTE grants are NOT
--     touched by this file, so every client call into them still works.
--   * Edge functions brevo-webhook and meta-ads-alerts, both of which read it
--     with SUPABASE_SERVICE_ROLE_KEY. service_role keeps its grants below.
--   * cron job 15, which runs as the job owner.
--   * No client code reads the table directly: the only mention in src/ is a
--     comment in AdminPanel.tsx noting that the purge passcode is checked
--     server-side.
--
-- And the stronger argument: RLS with no policies already denied anon and
-- authenticated every row, so nothing that works today can be relying on these
-- grants. Removing them cannot change behaviour — it can only remove a latent
-- privilege.
--
-- postgres (owner) and service_role are deliberately left alone. Those are the
-- two identities that actually read this table.
revoke all on public.app_secrets from anon;
revoke all on public.app_secrets from authenticated;

comment on table public.app_secrets is
  'Shared secrets the DATABASE must inject into outbound calls (pg_cron headers, '
  'notify_admin_push, log-ingest gates). Protected TWICE on purpose: RLS is on '
  'with no policies, AND anon/authenticated hold no table grants. Never grant '
  'either role access here, and never add a policy without re-reading why both '
  'layers exist — one of them alone has been the only gate before. Readers are '
  'SECURITY DEFINER functions owned by postgres, or service_role.';
