-- Per-creator rollups (clicks, sign-ups, paid tickets) computed in the database.
--
-- The All creators table on Team ▸ Creators used to download every raw row of
-- affiliate_clicks, applications (with an affiliate) and affiliate_sales and
-- count them in the browser. PostgREST silently caps every response at the
-- project's API "Max rows" setting (Supabase default 1,000), so once any of
-- those tables passed the cap the counts would quietly stop growing, with no
-- error anywhere. affiliate_clicks was at 646 rows on 2026-09-10 and grows with
-- every creator-link visit.
--
-- This returns ONE jsonb object keyed by affiliate id —
--   { "<affiliate_id>": { "clicks": n, "apps": n, "tickets": n }, ... }
-- — rather than one row per creator. The cap applies to set-returning
-- functions too, so a RETURNS TABLE version would only move the silent
-- truncation from 1,000 clicks to 1,000 creators. A single value is never
-- capped, and it is exactly the shape the client keeps in affiliateStats.
--
-- Founder-only, same guard as get_creator_payouts_outstanding(). A scalar
-- function can't bare-RETURN, so non-founders get NULL, which the client
-- treats as "no stats".

CREATE OR REPLACE FUNCTION public.get_affiliate_rollups()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT COALESCE(is_admin_strict(), false) THEN
    RETURN NULL;
  END IF;
  RETURN (
    WITH clicks AS (
      SELECT affiliate_id, count(*)::int AS n
      FROM public.affiliate_clicks
      WHERE affiliate_id IS NOT NULL
      GROUP BY affiliate_id
    ), apps AS (
      SELECT affiliate_id, count(*)::int AS n
      FROM public.applications
      WHERE affiliate_id IS NOT NULL
      GROUP BY affiliate_id
    ), tickets AS (
      SELECT affiliate_id, count(*)::int AS n
      FROM public.affiliate_sales
      GROUP BY affiliate_id
    )
    SELECT COALESCE(jsonb_object_agg(af.id, jsonb_build_object(
             'clicks',  COALESCE(c.n, 0),
             'apps',    COALESCE(a.n, 0),
             'tickets', COALESCE(t.n, 0)
           )), '{}'::jsonb)
    FROM public.affiliates af
    LEFT JOIN clicks  c ON c.affiliate_id = af.id
    LEFT JOIN apps    a ON a.affiliate_id = af.id
    LEFT JOIN tickets t ON t.affiliate_id = af.id
  );
END
$$;

REVOKE ALL ON FUNCTION public.get_affiliate_rollups() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_affiliate_rollups() TO authenticated;
