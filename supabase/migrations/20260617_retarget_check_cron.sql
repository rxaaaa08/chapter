-- Schedules the retarget-check edge function to run every 30 minutes.
-- Mirrors the cart-abandonment-check job's pattern. The edge function
-- flips applications.re_target to true for invited rows whose AiSensy
-- invite was sent >= 24h ago and which still have no bill_opens row.
SELECT cron.schedule(
  'retarget-check',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/retarget-check',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
