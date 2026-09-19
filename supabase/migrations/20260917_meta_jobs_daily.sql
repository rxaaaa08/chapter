-- Every scheduled Meta job runs once a day. Founder's decision, 2026-09-17.
--
-- THE DECISION
-- Asked because the project is on the Supabase free plan. The numbers put to him
-- first, measured 2026-09-17:
--   * ~380 edge-function runs a day in total, ~11,000 a month, against the free
--     plan's 500,000. The Meta jobs were ~200 a day, about 1.2% of the plan.
--   * Database 75 MB of 500 MB, with all meta_* tables under 1 MB.
-- The trade-offs, stated once:
--   * Application retry (capi-lead-sweep): a failed send reaches Meta up to a day
--     late. An application submitted in the 10 minutes before the daily run is
--     never retried, because the sweep only takes rows 10 min to 24 h old.
--   * Ad alerts: rejected ads and cost-alarm breaches surface up to a day late
--     once ads run. The Ads Manager daily-spend rule stays the hard stop.
--   * Spend sync: Growth ▸ Ads is up to a day old.
-- He chose everything daily. Do not re-propose faster schedules unless he asks,
-- e.g. when ads start spending or the plan changes.
--
-- THE DAILY ORDER (UTC -> IST), chosen so each job reads what the one before wrote:
--   03:07 -> 08:37  capi-lead-sweep        BEFORE the watchdog, see below
--   03:20 -> 08:50  meta-ads-sync          spend, then the account-level spend check
--   03:37 -> 09:07  meta-ads-alerts        cost alarms judge the spend just synced
--   03:41 -> 09:11  meta-signal-watchdog   unchanged (20260917_meta_signal_watchdog_daily)
--   04:50 -> 10:20  meta-audience-sync     unchanged schedule
--
-- The retry was first placed at 03:52, after the watchdog, and moved to 03:07 the
-- same day (applied as meta_jobs_daily_retry_before_watchdog). The watchdog's
-- lead check treats an application Meta has not received as missing. With the
-- retry after it, an application whose real-time send failed would still be
-- unsent when the watchdog looked, so the check would report a gap the retry
-- was about to close. Two such applications in a row would push a false
-- "broken" alarm. Running the retry first also keeps the watchdog's
-- `lead_sends_failing` detail honest: it counts what is still unsent AFTER a
-- retry.
--
-- ONE UNVERIFIED RISK, recorded rather than guessed at: Meta's hourly /stats
-- may bucket an event by when it ARRIVED rather than by its event_time. If so,
-- an application the retry sends hours after it was submitted lands in a
-- different hour, and the watchdog's ±1 h matching still reads it as missing.
-- Every lead seen so far was sent within minutes, so the data cannot tell the
-- two apart. If lead_server shows gaps while lead_sends_failing is 0, this is
-- the likely cause.
--
-- None of the times lands on :00/:15/:30/:45, where verify-pending-payments and
-- cart-abandonment run.
--
-- TIMEOUT, ADDED TO ALL OF THEM
-- pg_net gives up after 5 s by default. meta-ads-sync measured 4.0-6.3 s on its
-- scheduled runs on 16 Sep, and 5.4-7.1 s once the spend check was added. The
-- watchdog hit the same limit on 16 Sep (20260916_meta_signal_watchdog_cron.sql).
-- The function keeps running after pg_net gives up, but the runtime may tear a
-- request down once its caller has gone, and net._http_response then records a
-- timeout for a run that worked. With one run a day, a torn-down run is a lost
-- day, so every Meta job now gets 60 s.
--
-- Comments inside meta-ads-sync and meta-ads-alerts still speak of 6-hourly and
-- 15-minute runs. They predate this change and were deliberately not edited, to
-- avoid redeploying working functions for comments; this file is the record.

select cron.alter_job(
  (select jobid from cron.job where jobname = 'meta-ads-sync'),
  schedule := '20 3 * * *',
  command := $cmd$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-sync',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cmd$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'meta-ads-alerts'),
  schedule := '37 3 * * *',
  command := $cmd$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-alerts',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cmd$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'capi-lead-sweep'),
  schedule := '7 3 * * *',
  command := $cmd$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/capi-lead?sweep=1',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cmd$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'meta-audience-sync'),
  command := $cmd$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-audience-sync',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cmd$
);
