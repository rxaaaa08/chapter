-- Meta Conversions API — Phase B match-quality upgrade (see meta-ads-sop.md).
--
-- WHY
-- Our server reports every paid ticket to Meta, including the ones the browser
-- pixel can never see (tab closed on PayU, UPI handoff into another browser).
-- But Meta's _fbp cookie — the signal that ties a sale back to the browser it
-- showed the ad to — exists ONLY in the customer's browser. The server has no
-- way to read it.
--
-- So the browser hands it to create-payu-order at checkout and we park it on
-- the payment row. payu-callback and payu-webhook read it back when they report
-- the Purchase, which is the only moment it is needed.
--
-- Deliberately on payu_payments rather than applications.attribution: that JSONB
-- column carries traffic-SOURCE semantics (null there means "direct/organic"),
-- and _fbp is present for practically every unblocked visitor. Writing it there
-- would make every organic booking look attributed.
--
-- Additive and nullable: every existing row stays untouched, and the column is
-- inert until the matching code ships.
alter table public.payu_payments
  add column if not exists fbp text;

comment on column public.payu_payments.fbp is
  'Meta _fbp browser cookie captured at checkout, replayed to the Conversions API on payment. Raw, never hashed. Null when the pixel was blocked.';
