-- Give meta-ads-alerts a caller secret, and teach its cron to send it.
--
-- THE PROBLEM
-- meta-ads-alerts is deployed --no-verify-jwt because pg_cron calls it with no
-- JWT. That left it open: anyone who learns the URL can invoke it. It cannot
-- forge data — it only reads meta_ads_events rows the webhook already
-- HMAC-verified — and it is idempotent, so a double run writes nothing twice.
--
-- Idempotence protects the DATA. It does not protect the QUOTA, and that is the
-- hole. Every call makes real Graph calls on META_ADS_ACCESS_TOKEN, and Meta's
-- rate limiting doc (read 2026-09-18) describes what sits at the end of that
-- road: a 613 with no subcode, meaning Meta detected "a large amount of
-- abnormal traffic" from this ad account and CUT its quota until a human
-- contacts support. An unauthenticated endpoint that spends Graph quota is the
-- most plausible way this account ever generates that traffic.
--
-- 20260908_meta_ads_alerts_cron.sql deferred this deliberately: "decide it when
-- writing the cron, not before". The cron is job 15 and has existed since
-- 2026-09-08, so that reason has expired.
--
-- WHY THE SECRET LIVES IN app_secrets AND NOT IN FUNCTION SECRETS
-- Handoff §23 ("Authentication") says secrets are kept OUT of the database on
-- purpose, and that rule stands for anything that talks to Meta, PayU or
-- WhatsApp. This is a different kind of value and the exception is the same one
-- notify_admin_push() already relies on: the caller here is Postgres, which
-- cannot read Supabase function secrets, so a header it must inject has to come
-- from a table. admin_push_secret has worked this way since the push system was
-- built.
--
-- The value is also not a credential to anything. It proves "this call came
-- from our cron" to an endpoint that reads our own inbox and sends our own
-- notifications. Losing it costs a stranger's ability to make us drain our own
-- queue; losing META_ADS_ACCESS_TOKEN costs the account.
--
-- Because BOTH sides read this same row — the cron injects it, the function
-- compares against it — rotating it is a single UPDATE with no deploy and no
-- window where the two disagree:
--   update public.app_secrets set value = encode(extensions.gen_random_bytes(32),'hex'),
--          updated_at = now() where name = 'meta_alerts_secret';
--
-- ORDER MATTERS, AND THIS FILE IS THE FIRST HALF.
-- Applying this alone is safe: the cron starts sending a header the deployed
-- function ignores. Deploying the gated function FIRST would have locked the
-- cron out of its own endpoint for up to a day, because these jobs run daily
-- (§8) and a 401 does not retry. Apply this, then deploy meta-ads-alerts.

-- 64 hex chars, matching the other secrets in this table. ON CONFLICT DO
-- NOTHING so replaying the migration never rotates a live secret by surprise.
insert into public.app_secrets (name, value)
values ('meta_alerts_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

-- alter_job, not schedule(): the schedule itself is the founder's 2026-09-17
-- daily decision (09:07 IST, after the spend sync so the cost alarms judge
-- fresh spend) and must not be silently rewritten by a change about auth.
-- timeout_milliseconds stays 60000 — pg_net gives up after 5s by default and
-- this function makes Meta calls, so dropping it would record timeouts for runs
-- that worked (§8).
select cron.alter_job(
  (select jobid from cron.job where jobname = 'meta-ads-alerts'),
  command := $job$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-alerts',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',          'application/json',
      'X-Meta-Alerts-Secret',  COALESCE(
        (select value from public.app_secrets where name = 'meta_alerts_secret'), ''
      )
    ),
    timeout_milliseconds := 60000
  );
  $job$
);
