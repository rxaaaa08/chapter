-- Run the Meta signal watchdog every hour.
--
-- SUPERSEDED 2026-09-17: now once a day at 03:41 UTC, the founder's decision.
-- See 20260917_meta_signal_watchdog_daily.sql. The reasoning below is the
-- original hourly case, kept for the record.
--
-- PREREQUISITE, ALREADY MET: meta-signal-watchdog was deployed 2026-09-16
-- (--no-verify-jwt, verified verify_jwt:false afterwards) and run once by hand
-- before this was scheduled. Scheduling first would post to a 404 every hour and
-- cron.job_run_details would still say 'succeeded' — see handoff §8.
--
-- WHY HOURLY
-- The question is "are sales reaching Meta", measured in lost sales, and at
-- today's volume a sale happens about once a day. An hour of detection latency
-- costs nothing; every 15 minutes would quadruple Graph calls for no earlier
-- answer, because the check waits a 2-hour lag before judging an event anyway.
-- The token probe is the part that benefits from running often, and hourly means
-- a revoked token is known within the hour — before the next sale, not after it.
--
-- WHY :41
-- Every other job lands on :00/:15/:30/:45 (verify-pending-payments,
-- capi-lead-sweep, cart-abandonment), :20 (meta-ads-sync) or :07/:22/:37/:52
-- (meta-ads-alerts). :41 collides with none of them, so no cold starts stack.
--
-- No auth header, same as every other cron here. The function refuses a run
-- within 5 minutes of the previous one (429), which bounds what a stranger with
-- the URL can spend, and it only ever reads from Meta.
--
-- timeout_milliseconds IS REQUIRED HERE, unlike the other crons. pg_net's default
-- is 5 s and a run takes ~8-9 s (a debug_token call, a Pixel read and two /stats
-- reads, each a round trip to Meta). The first scheduled run, 2026-09-16 11:41,
-- was scheduled without it: all six checks were written by 11:41:08, but
-- net._http_response recorded "Timeout of 5000 ms reached". That is fragile
-- twice over. The runtime may tear a request down once its caller has gone,
-- and the table §8 says to trust would report a timeout for a run that worked.
-- Applied the same day as meta_signal_watchdog_cron_timeout (cron.alter_job).
select cron.schedule(
  'meta-signal-watchdog',
  '41 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-signal-watchdog',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
