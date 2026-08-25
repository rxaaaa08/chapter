-- Lead backstop cron.
--
-- ⚠️ APPLY THIS ONLY AFTER capi-lead HAS BEEN DEPLOYED. Scheduling it first just
-- posts to a URL that 404s every 15 minutes until the function exists.
--
-- Every 15 min, matching verify-pending-payments. The sweep itself ignores rows
-- younger than 10 minutes, so a Lead the browser failed to deliver reaches Meta
-- within ~25 minutes worst case — comfortably inside Meta's guidance that events
-- delayed beyond about two hours start to hurt delivery.
--
-- No auth header, same as the other crons here: capi-lead is deployed
-- --no-verify-jwt, the sweep returns only a count, and it is idempotent because
-- a reported row is stamped and never picked up twice.
select cron.schedule(
  'capi-lead-sweep',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/capi-lead?sweep=1',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
