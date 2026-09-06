-- The value we report to Meta for a booking, decided once at order time.
--
-- WHY A STORED COLUMN AND NOT A CALCULATION
-- Two independent reporters describe the same sale: the browser Purchase on the
-- receipt screen and the server Purchase from payu-callback / payu-webhook /
-- verify-pending-payments. Meta deduplicates them on event_id and keeps ONE —
-- whichever it decides to keep. So if the two compute the value separately and
-- ever disagree (a price edited between booking and receipt, a city override
-- resolved differently, a rounding difference), the number that lands in Ads
-- Manager is whichever event won the race. Storing it once removes the race:
-- every reporter reads this column and they cannot drift.
--
-- WHY IT IS NOT payu_payments.amount
-- `amount` is what PayU CHARGED, and for a split booking that is the advance
-- only — ₹102.42 on a ₹299 ticket. Reporting that told Meta every split sale was
-- worth the same ₹102, which is both a ~3x understatement of revenue and a
-- near-constant number. Meta flagged both: "All of your website Purchase events
-- are sending the same price data", and value optimisation cannot rank
-- conversions that are all identical.
--
-- This column instead holds the value of the BOOKING the ad won: the city-aware
-- ticket price × quantity, excluding PayU's transaction fee (which is the
-- customer's cost, not our revenue, and would otherwise vary the figure by a few
-- rupees for no business reason).
--
-- Measured 2026-09-03: 89 of 111 advances on past events (80.2%) went on to
-- fully_paid, so ~20% of split bookings report a value that is never fully
-- collected. That is the deliberate trade — comparable to e-commerce return
-- rates, and Meta's value-optimisation guidance explicitly permits "estimated
-- monetary value". The alternative understates every sale by 3x, which would
-- make ROAS read far worse than it is and push spend down.
--
-- NULL on balance payments: those are never reported to Meta at all (the sale
-- was already counted at the advance), so there is no value to state. NULL also
-- on every row written before this column existed — the readers fall back to
-- `amount`, which is exactly what they sent before.

alter table public.payu_payments
  add column if not exists reported_value numeric;

comment on column public.payu_payments.reported_value is
  'Value reported to Meta for this booking: city-aware ticket price x quantity, '
  'excluding PayU fees. Set at order time by create-payu-order so the browser '
  'and server Purchase events cannot disagree. NULL on balance payments (never '
  'reported) and on rows predating this column (readers fall back to amount).';
