-- Flat creator commission per event (owner decision, 2026-07-25).
--
-- Why: a percentage produces a different rupee figure for every city and every
-- ticket type on the same event — Sunrise at Kovalam pays ₹56 from Chennai
-- (₹699) but ₹24 own-transport (₹299). A creator cannot be told a straight
-- answer, and the dashboard had to either pick one city or show a range. The
-- owner would rather set the fee directly: ₹35 for the meetup, ₹100 for Pondy.
--
-- This also matches how the rest of the commissions already work:
-- events.marketer_commission and events.manager_commission are already flat
-- per-event rupee amounts. Creator commission was the odd one out.
--
-- Shape: `affiliate_commission` is the flat fee and WINS when set (> 0);
-- otherwise the old percentage path still applies, so the events already
-- accruing on a percentage are untouched and the field can be cleared to revert.

alter table public.events
  add column if not exists affiliate_commission numeric;

comment on column public.events.affiliate_commission is
  'Flat creator commission in rupees per paid ticket. When > 0 it overrides affiliate_commission_pct, and applies to every city and ticket type. Mirrors marketer_commission / manager_commission.';

-- ── Money out: the accrual ──────────────────────────────────────────────────
-- Same trigger and guards as before (fully_paid transition, affiliate_enabled,
-- idempotent on application_id); only the amount resolution gains the flat path.
create or replace function public.accrue_affiliate_sale()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_enabled boolean;
  v_pct     numeric(5,2);
  v_flat    numeric(10,2);
  v_full    numeric(10,2);
  v_amount  numeric(10,2);
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.affiliate_id IS NOT NULL
  THEN
    SELECT affiliate_enabled, COALESCE(affiliate_commission_pct, 8), affiliate_commission
      INTO v_enabled, v_pct, v_flat
      FROM events WHERE slug = NEW.event_slug;

    IF COALESCE(v_enabled, false) THEN
      IF COALESCE(v_flat, 0) > 0 THEN
        -- Flat fee: the same rupees regardless of city or ticket type.
        v_amount := round(v_flat, 2);
      ELSE
        v_full   := affiliate_full_price(NEW.event_slug, NEW.selected_city);
        v_amount := round(COALESCE(v_pct, 8) / 100.0 * COALESCE(v_full, 0), 2);
      END IF;

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

-- ── Reporting: the profit forecast must charge the same amount ───────────────
-- get_performance_summary subtracts creator commission from committed profit.
-- If it kept computing a percentage while the accrual pays a flat fee, reported
-- margins would be wrong the moment a flat fee is set.
--
-- Patched surgically rather than re-declared: this is a 142-line founder-facing
-- money function whose body contains regex escapes that are easy to corrupt by
-- retyping, and the live definition has drifted from migrations before. The
-- rewrite is derived from the live source and RAISES if the expected expression
-- is absent, so it can never silently patch the wrong thing.
do $do$
declare
  v_def text;
  v_new text;
begin
  select pg_get_functiondef(p.oid) into v_def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'get_performance_summary';

  if v_def is null then
    raise exception 'get_performance_summary not found';
  end if;

  v_new := regexp_replace(
    v_def,
    'round\(COALESCE\(e\.affiliate_commission_pct, 8\) / 100\.0\s*\* event_net_price\(a\.event_slug, a\.selected_city, ''full''\), 2\)',
    'COALESCE(NULLIF(e.affiliate_commission, 0), round(COALESCE(e.affiliate_commission_pct, 8) / 100.0 * public.affiliate_full_price(a.event_slug, a.selected_city), 2))',
    'g'
  );

  if v_new = v_def then
    raise exception 'affiliate commission expression not found in get_performance_summary — aborting rather than guessing';
  end if;

  execute v_new;
end
$do$;
