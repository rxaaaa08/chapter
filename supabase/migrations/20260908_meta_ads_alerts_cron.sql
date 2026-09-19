-- Drain the Meta webhook inbox on a schedule.
--
-- PREREQUISITE, ALREADY MET: meta-ads-alerts was first deployed 2026-09-08
-- (--no-verify-jwt, verified verify_jwt:false afterwards). Scheduling before the
-- deploy would have posted to a URL that 404s every 15 minutes — the warning at
-- the top of 20260825_capi_lead_sweep_cron.sql, which applies here identically.
--
-- WHY A CRON AT ALL, WHEN THE WEBHOOK IS ALREADY PUSH-BASED
-- meta-ads-webhook deliberately does nothing but store and return 200 fast:
-- Meta retries anything slow or non-200, so real work inside the handler buys
-- duplicate deliveries. The inbox therefore fills there and is drained here.
-- Without this job nothing ever drains it, and meta_ads_events grows a permanent
-- backlog of unread rows describing ads nobody was told about.
--
-- WHY EVERY 15 MINUTES
-- The payload is an ad-object issue: a rejection or a delivery block. That does
-- not burn money — a rejected ad is not running — but it silently stalls a
-- campaign, and the cost is measured in hours of not knowing. 15 minutes matches
-- verify-pending-payments and capi-lead-sweep.
--
-- Frequency is NOT the same as notification volume here. The function suppresses
-- a repeat about the same object for 6 hours (REPEAT_SUPPRESSION_HOURS), and
-- Meta re-sends an issue for as long as it persists — so without that guard this
-- schedule would push about one rejected ad 96 times a day. The two settings
-- were designed against each other; changing this schedule without re-reading
-- that constant is how this turns into noise.
--
-- OFFSET BY 7 MINUTES, deliberately. verify-pending-payments and capi-lead-sweep
-- both run at :00/:15/:30/:45, and meta-ads-sync at :20. Landing a third
-- quarter-hourly job on the same minute stacks three edge-function cold starts
-- and three bursts of pg_net traffic into the same second for no benefit.
-- 7/22/37/52 interleaves them. Written as an explicit list rather than
-- '7-59/15' because the list is legible to someone who does not read cron.
--
-- No auth header, same as every other cron here: the function is deployed
-- --no-verify-jwt, and it is idempotent — a handled row is stamped with
-- handled_at and never picked up twice, so a double run is a no-op rather than a
-- double notification.
--
-- SUPERSEDED 2026-09-18 by 20260918_meta_ads_alerts_auth.sql. The paragraph
-- above is left in place because its reasoning is the thing that turned out to
-- be incomplete, and deleting it would hide why. Idempotence makes a double run
-- harmless to the DATA; it says nothing about the QUOTA. Every call spends real
-- Graph quota on META_ADS_ACCESS_TOKEN, and Meta's response to sustained
-- abnormal traffic is to cut this ad account's quota until a human contacts
-- support. The cron now injects X-Meta-Alerts-Secret from app_secrets and the
-- function refuses anything else.
select cron.schedule(
  'meta-ads-alerts',
  '7,22,37,52 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-alerts',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
