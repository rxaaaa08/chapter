-- creator_events_since: per-event breakdown of the calling creator's PAID
-- tickets within a time window [p_from, now] — which events sold, how many
-- tickets, how much earned, via their link. Itemizes the "Paid" funnel tile.
-- applications + events are RLS-locked for creators, so this SECURITY DEFINER
-- function (scoped to current_affiliate_id) is the only safe way to expose it.
CREATE OR REPLACE FUNCTION public.creator_events_since(p_from timestamptz)
RETURNS TABLE (
  event_slug text,
  title      text,
  tickets    integer,
  earned     numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.event_slug,
         COALESCE(e.title, a.event_slug) AS title,
         count(*)::int                   AS tickets,
         COALESCE(sum(s.amount), 0)       AS earned
    FROM affiliate_sales s
    JOIN applications a ON a.id = s.application_id
    LEFT JOIN events e  ON e.slug = a.event_slug
   WHERE s.affiliate_id = current_affiliate_id()
     AND s.accrued_at >= p_from
   GROUP BY a.event_slug, e.title
   ORDER BY tickets DESC, earned DESC;
$$;
REVOKE ALL ON FUNCTION public.creator_events_since(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.creator_events_since(timestamptz) TO authenticated;
