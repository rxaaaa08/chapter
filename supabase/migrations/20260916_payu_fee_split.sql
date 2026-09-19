-- payu_fee_split: which part of a PayU payment is the ticket, and which part is
-- the gateway fee the customer paid on top.
--
-- WHY THIS EXISTS
-- Customers pay PayU's fee on top of the ticket, as its own line on the bill
-- page, and PayU keeps it. The fee is grossed up so that after PayU's cut the
-- business receives exactly the ticket price (src/PaymentOverlay.tsx):
--
--   UPI, debit card, net banking, pay later : PayU takes 2.36% -> customer pays +2.42%
--   credit card, EMI                        : PayU takes 3.54% -> customer pays +3.67%
--   wallets (cash card)                     : PayU takes 4.72% -> customer pays +4.95%
--
-- So payu_payments.amount is NOT money the business keeps. Revenue and ROAS
-- built on it read 2.4-5% high, by an amount that depends on how each customer
-- chose to pay. Meta's Purchase value (reported_value) was already fee-free, so
-- our side and Meta's side were not comparing like with like.
--
-- HOW
-- The ticket amount is not stored on the payment row, but PayU's response says
-- which method was used (payu_response->>'mode'). This applies that method's
-- rate and then CHECKS the answer: ticket prices are whole rupees, so a correct
-- split lands on whole rupees, to within the paisa rounding create-payu-order
-- applies to the total. Measured 2026-09-16: all 156 successful payments split
-- cleanly (147 UPI, 5 credit card via UPI, 3 credit card, 1 with no mode).
--
-- A split that does not check out returns NULLs, never a guess. Callers count
-- those as "fee unknown" and show the count, so a rate change nobody mirrored
-- here surfaces as a visible number instead of silently wrong revenue.
--
-- KEEP IN STEP WITH: FEE_RATES in supabase/functions/create-payu-order/index.ts
-- and PAYMENT_METHOD_GROUPS in src/PaymentOverlay.tsx. The method keys below are
-- the ids used there, plus upi_credit_card, no_fee and other.

create or replace function public.payu_fee_split(
  p_amount numeric,
  p_mode   text,
  out ticket_amount numeric,
  out fee_amount    numeric,
  out fee_rate      numeric,
  out method        text
)
language plpgsql
immutable
set search_path to 'public'
as $$
declare
  -- create-payu-order rounds the total to the paisa, so the total is off from
  -- ticket x (1 + rate) by at most 0.005, and dividing by (1 + rate) only
  -- shrinks that. Anything further from a whole rupee is not this rate.
  tolerance constant numeric := 0.0051;
  v_mode text := upper(btrim(coalesce(p_mode, '')));
  v_key  text;
  v_rate numeric;
  v_base numeric;
  v_hits int := 0;
  v_cand numeric;
begin
  if p_amount is null or p_amount <= 0 then
    return;
  end if;

  -- 1. The method PayU says was used, at the rate our bill page charged for it.
  select m.key, m.rate into v_key, v_rate
  from (values
    ('upi',             0.0242::numeric, 'UPI'),
    -- A credit card paid through UPI. The customer chose UPI on our bill page
    -- and was charged the UPI rate (all 5 such payments to 2026-09-16). Kept as
    -- its own key so it stays visible: whether PayU also deducts only the UPI
    -- rate on these is unconfirmed until checked against a settlement report.
    ('upi_credit_card', 0.0242,          'UPICC'),
    ('debitcard',       0.0242,          'DC'),
    ('netbanking',      0.0242,          'NB'),
    ('bnpl',            0.0242,          'BNPL'),
    ('creditcard',      0.0367,          'CC'),
    ('emi',             0.0367,          'EMI'),
    ('cashcard',        0.0495,          'CASH')
  ) as m(key, rate, payu_mode)
  where m.payu_mode = v_mode;

  if v_rate is not null then
    v_base := p_amount / (1 + v_rate);
    if abs(v_base - round(v_base)) < tolerance then
      ticket_amount := round(v_base);
      fee_amount    := p_amount - ticket_amount;
      fee_rate      := v_rate;
      method        := v_key;
      return;
    end if;
  end if;

  -- 2. No mode, an unrecognised one, or its rate does not check out. Accept a
  --    rate only when exactly ONE lands on whole rupees. Two fits are genuinely
  --    ambiguous: Rs 5,121.00 is both Rs 5,000 + 2.42% and a fee-free Rs 5,121.
  foreach v_cand in array array[0, 0.0242, 0.0367, 0.0495]::numeric[] loop
    v_base := p_amount / (1 + v_cand);
    if abs(v_base - round(v_base)) < tolerance then
      v_hits        := v_hits + 1;
      ticket_amount := round(v_base);
      fee_rate      := v_cand;
    end if;
  end loop;

  if v_hits = 1 then
    fee_amount := p_amount - ticket_amount;
    method     := case when fee_rate = 0 then 'no_fee' else 'other' end;
    return;
  end if;

  ticket_amount := null;
  fee_amount    := null;
  fee_rate      := null;
  method        := null;
end;
$$;

comment on function public.payu_fee_split(numeric, text) is
  'Splits a PayU payment into ticket money and the gateway fee the customer paid on top, by payment method. NULLs when the split does not land on whole rupees: callers must count those as fee unknown, never guess. Rates mirror FEE_RATES in create-payu-order.';

-- Pure arithmetic with no data access, but nothing outside the database needs
-- it: the founder RPCs that use it run as SECURITY DEFINER.
revoke all on function public.payu_fee_split(numeric, text) from public, anon, authenticated;
