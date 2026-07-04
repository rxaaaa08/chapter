-- creator_stats_since: the calling creator's funnel + earnings within a time
-- window [p_from, now]. Powers the date-range selector on the creator dashboard
-- (24h / week / month / 90d) and the monthly-earnings figure. Mirrors
-- creator_stats() but time-scoped. applications is RLS-locked for creators, so
-- this SECURITY DEFINER function is the only way they can get period counts.
-- clicks -> affiliate_clicks.created_at; bookings -> applications.created_at;
-- paid tickets + earned -> affiliate_sales.accrued_at.
CREATE OR REPLACE FUNCTION public.creator_stats_since(p_from timestamptz)
RETURNS TABLE (
  clicks_total   integer,
  clicks_unique  integer,
  apps_total     integer,
  tickets_paid   integer,
  earned         numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH me AS (SELECT current_affiliate_id() AS id)
  SELECT
    (SELECT count(*)::int FROM affiliate_clicks c, me WHERE c.affiliate_id = me.id AND c.created_at >= p_from),
    (SELECT count(DISTINCT coalesce(c.session_id, c.id::text))::int FROM affiliate_clicks c, me WHERE c.affiliate_id = me.id AND c.created_at >= p_from),
    (SELECT count(*)::int FROM applications a, me WHERE a.affiliate_id = me.id AND a.created_at >= p_from),
    (SELECT count(*)::int FROM affiliate_sales s, me WHERE s.affiliate_id = me.id AND s.accrued_at >= p_from),
    (SELECT COALESCE(sum(s.amount), 0) FROM affiliate_sales s, me WHERE s.affiliate_id = me.id AND s.accrued_at >= p_from);
$$;
REVOKE ALL ON FUNCTION public.creator_stats_since(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.creator_stats_since(timestamptz) TO authenticated;
