-- Move the retarget-check job from every 30 minutes to once daily at 19:00
-- IST (13:30 UTC). The job only evaluates a 24-hour condition — "invited >=
-- 24h ago and still never opened the bill" — so a 30-minute cadence bought
-- nothing except 47 extra no-op runs per day. One evening pass flags the
-- day's cold invitees right before call marketers plan their follow-ups.
-- Flagging up to ~24h later than the rolling check is acceptable: re_target
-- is a People-page badge for human follow-up, not a time-critical automation.
SELECT cron.unschedule('retarget-check')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retarget-check');
SELECT cron.schedule(
  'retarget-check',
  '30 13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/retarget-check',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
