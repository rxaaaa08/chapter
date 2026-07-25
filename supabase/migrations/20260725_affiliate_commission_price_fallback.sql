-- Protect creator earnings when a booking's city can't be priced.
--
-- Creator commission accrues as pct × event_net_price(slug, selected_city, 'full').
-- event_net_price falls back to the PLAN-LEVEL events.price_full when the city
-- lookup misses — and that column is invisible legacy: the admin trip editor
-- only writes per-city prices, so plan-level price_full is 0 on every event
-- created since June 2026 and stale-high on the April ones (Kovalam ₹900 vs its
-- real ₹699/₹299).
--
-- Consequences of that fallback for creators:
--   • price_full = 0  → amount rounds to 0 → the accrual writes NO ROW AT ALL.
--     The creator silently earns nothing and nobody is told. Chill Sunday
--     Meetup (135 applications) sits in exactly this state.
--   • price_full stale-high → the creator is over-credited.
--
-- Fix, deliberately narrow: give the AFFILIATE accrual its own price resolver
-- that falls back to the LOWEST price among the event's offered cities before
-- it ever reaches the invisible column. Checkout (create-payu-order), revenue
-- and profit reporting (get_performance_summary), and marketer/manager
-- commission all keep using event_net_price unchanged — this touches creator
-- money only. Chill Sunday's plan-level 0 is left alone on purpose: it makes
-- checkout fail closed rather than charge a guessed price.
--
-- No behaviour changes for any booking taken so far: every existing
-- application carries a selected_city that matches its event's city_details
-- exactly, so the first branch resolves and the result is identical.

-- Resolve the full price a creator's commission should be based on.
--   1. the buyer's city, matched case-insensitively (matches how
--      create-payu-order picks the price the customer actually paid);
--   2. else the lowest full price among the cities the event actually offers
--      (events.cities, ignoring the "Other" catch-all) — conservative, so we
--      under-credit rather than over-credit when the city is unknown;
--   3. else the plan-level price_full, for older events that have no per-city
--      pricing at all (e.g. pondicherry-weekend-escape);
--   4. else 0, which still means "no commission row" — a genuinely unpriced
--      event should not accrue.
create or replace function public.affiliate_full_price(p_slug text, p_city text)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  with e as (
    select city_details, cities, price_full from events where slug = p_slug
  ),
  city_match as (
    select nullif(d.value ->> 'price_full', '')::numeric as price
      from e, jsonb_each(coalesce(e.city_details, '{}'::jsonb)) as d
     where lower(d.key) = lower(coalesce(p_city, ''))
     limit 1
  ),
  offered_low as (
    select min(nullif(e.city_details -> c.city ->> 'price_full', '')::numeric) as price
      from e
      cross join lateral jsonb_array_elements_text(coalesce(e.cities, '[]'::jsonb)) as c(city)
     where lower(c.city) <> 'other'
       and coalesce(nullif(e.city_details -> c.city ->> 'price_full', '')::numeric, 0) > 0
  )
  select coalesce(
    nullif((select price from city_match), 0),
    nullif((select price from offered_low), 0),
    nullif((select price_full from e), 0),
    0
  );
$function$;

revoke all on function public.affiliate_full_price(text, text) from public;

-- Same trigger as before, with the price resolution swapped. Everything else —
-- the fully_paid transition guard, the affiliate_enabled check, the 8% default,
-- and idempotency via ON CONFLICT (application_id) — is unchanged.
create or replace function public.accrue_affiliate_sale()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_enabled boolean;
  v_pct     numeric(5,2);
  v_full    numeric(10,2);
  v_amount  numeric(10,2);
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.affiliate_id IS NOT NULL
  THEN
    SELECT affiliate_enabled, COALESCE(affiliate_commission_pct, 8)
      INTO v_enabled, v_pct
      FROM events WHERE slug = NEW.event_slug;

    IF COALESCE(v_enabled, false) THEN
      v_full   := affiliate_full_price(NEW.event_slug, NEW.selected_city);
      v_amount := round(COALESCE(v_pct, 8) / 100.0 * COALESCE(v_full, 0), 2);
      IF v_amount > 0 THEN
        INSERT INTO affiliate_sales (application_id, affiliate_id, amount)
        VALUES (NEW.id, NEW.affiliate_id, v_amount)
        ON CONFLICT (application_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END
$function$;
