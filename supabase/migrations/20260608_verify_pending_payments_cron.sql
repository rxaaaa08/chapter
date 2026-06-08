-- Reconciliation cron for the verify-pending-payments edge function (PayU
-- "Verify Payment" backstop). Every 15 min it asks the function to pull PayU's
-- authoritative status for any payu_payments row stuck at 'pending' (15 min–24 h
-- old) and resolve it — the safety net for a browser callback AND S2S webhook
-- that both got missed/delayed. Mirrors the cart-abandonment cron.
--
-- IMPORTANT: apply this only AFTER the verify-pending-payments function is
-- deployed, otherwise the cron will POST to a 404 every 15 minutes.
--
-- Idempotent: unschedules any existing job of the same name first so this can
-- be re-run safely.
do $$
begin
  perform cron.unschedule('verify-pending-payments');
exception
  when others then null; -- job didn't exist yet
end $$;

select cron.schedule(
  'verify-pending-payments',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/verify-pending-payments',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $cron$
);
