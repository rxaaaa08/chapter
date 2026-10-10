-- A booking that came from a Meta ad pays NO creator commission.
--
-- Owner's decision, 2026-09-26, on cloud-audit OPP-10 (CLOUD-META-OPPORTUNITIES.md):
-- "creator must not get commission for a booking that also came from an ad."
--
-- WHY IT WAS POSSIBLE: a booking stores the ad it came from
-- (applications.attribution->>'utm_content', stamped on the FIRST insert) and,
-- separately, a creator (affiliate_id). For open events the creator is re-set at
-- payment time (attribute_open_application), so someone who first clicked an ad
-- and later returned through a creator's link was an ad sale in the ROAS numbers
-- AND a creator sale. accrue_affiliate_sale() looked only at affiliate_id.
-- Measured 2026-09-26: 4 events have affiliate_enabled, 33 creator sales exist,
-- 0 bookings so far carry both — so nothing to claw back.
--
-- "CAME FROM AN AD" = the same test every ad report already uses
-- (get_meta_ads_performance, get_meta_ad_funnel, guardrails): utm_content is a
-- numeric Meta ad id. One definition in one function, so the commission rule and
-- the ad numbers can never disagree about which bookings were the ad's.
--
-- KNOWN LIMIT: attribution is stamped only on the application's FIRST insert. A
-- person who came through a creator's link first and clicked an ad afterwards
-- carries no ad id, so the creator is still paid. That is the honest reading of
-- the data we have: the booking row does not record a later ad click.
--
-- The creator link is NOT removed from the booking (affiliate_id stays), so
-- "the creator's link was used" remains visible; only the payout is withheld.
-- The creator dashboard counts paid tickets and earnings from affiliate_sales,
-- so a withheld sale never shows as earned there.

create or replace function public.booking_came_from_meta_ad(p_attribution jsonb)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select coalesce(p_attribution ->> 'utm_content', '') ~ '^[0-9]{6,}$';
$$;
comment on function public.booking_came_from_meta_ad(jsonb) is
  'True when a booking''s attribution carries a Meta ad id (utm_content = {{ad.id}}). The single definition used by creator commission (owner decision 2026-09-26: no creator commission on ad bookings) and matching every Meta ad report.';

do $patch$
declare v_def text; v_new text;
begin
  -- 1. The accrual trigger: no affiliate_sales row for an ad booking.
  v_def := pg_get_functiondef('public.accrue_affiliate_sale()'::regprocedure);
  v_new := replace(v_def,
$o$     AND NEW.affiliate_id IS NOT NULL
  THEN$o$,
$n$     AND NEW.affiliate_id IS NOT NULL
     -- Owner decision 2026-09-26: a booking that came from a Meta ad pays no
     -- creator commission, even if a creator link was also used (OPP-10).
     AND NOT public.booking_came_from_meta_ad(NEW.attribution)
  THEN$n$);
  if v_new = v_def then raise exception 'accrue_affiliate_sale: anchor not found — live definition drifted'; end if;
  execute v_new;

  -- 2. The Finances forecast: stop subtracting a commission that will never be paid.
  v_def := pg_get_functiondef('public.get_performance_summary'::regproc);
  v_new := replace(v_def,
$o$         - CASE WHEN e.affiliate_enabled AND a.affiliate_id IS NOT NULL
                THEN COALESCE($o$,
$n$         - CASE WHEN e.affiliate_enabled AND a.affiliate_id IS NOT NULL
                     -- No creator commission on ad bookings (2026-09-26).
                     AND NOT public.booking_came_from_meta_ad(a.attribution)
                THEN COALESCE($n$);
  if v_new = v_def then raise exception 'get_performance_summary: anchor not found — live definition drifted'; end if;
  execute v_new;
end
$patch$;
