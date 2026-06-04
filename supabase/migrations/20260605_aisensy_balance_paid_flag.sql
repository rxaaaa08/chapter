-- Tracking flag so the new "fullpaid" AiSensy template doesn't double-send
-- if PayU retries the callback / webhook. Mirrors aisensy_advance_paid_sent.
-- Fires from payu-callback and payu-webhook when paymentType === 'balance'
-- AND PayU status is success.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS aisensy_balance_paid_sent boolean DEFAULT false;
