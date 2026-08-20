-- Meta Conversions API — the last of the required/recommended parameters.
--
-- WHY
-- Meta lists client_user_agent as REQUIRED for website events, and recommends
-- the client IP. Today only payu-callback supplies them, because PayU's callback
-- is a form POST rendered in the CUSTOMER'S browser, so its request headers are
-- genuinely theirs.
--
-- payu-webhook sends neither, and that was correct: it is a server-to-server
-- call from PayU, so its headers describe PayU's machine, not the customer.
-- Forwarding those would have been worse than sending nothing — Meta scores a
-- supplied-but-unmatchable field against us.
--
-- But the webhook is the ONLY path that reports a sale when the customer never
-- comes back (tab closed on PayU, UPI handoff into another app) — exactly the
-- segment the Conversions API exists to recover. So those events, the ones that
-- matter most, are the ones missing a required parameter.
--
-- Fix follows the same shape as fbp: capture in create-payu-order, which IS a
-- direct call from the customer's browser, park it on the payment row, and
-- replay it from whichever path ends up reporting the sale.
--
-- source_url covers event_source_url, which is currently hardcoded to the
-- homepage regardless of where the booking actually happened.
--
-- Additive and nullable: existing rows are untouched, and the columns are inert
-- until the matching code ships.
alter table public.payu_payments
  add column if not exists client_ip         text,
  add column if not exists client_user_agent text,
  add column if not exists source_url        text;

comment on column public.payu_payments.client_ip is
  'Customer browser IP captured at checkout by create-payu-order. Replayed to the Conversions API on payment. Never PayU''s server IP.';
comment on column public.payu_payments.client_user_agent is
  'Customer browser user agent captured at checkout. Required by Meta for website events; the webhook path has no other source for it.';
comment on column public.payu_payments.source_url is
  'Page the customer was on when checkout started, for Meta event_source_url.';
