-- event_net_price previously preferred the plan-level price and only fell back to
-- the per-city override when the plan-level was 0. That's the OPPOSITE of checkout
-- (create-payu-order), where a per-city override (>0) wins. Result: events with a
-- stale non-zero plan price but a real per-city price showed the wrong price/profit
-- in the Performance tab. Flip the precedence: per-city override first, then plan.
CREATE OR REPLACE FUNCTION public.event_net_price(p_slug text, p_city text, p_kind text)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT CASE p_kind
    WHEN 'advance' THEN COALESCE(NULLIF((e.city_details -> p_city ->> 'price_advance'),'')::numeric,
                                 NULLIF(e.price_advance,0)::numeric, 0)
    ELSE              COALESCE(NULLIF((e.city_details -> p_city ->> 'price_full'),'')::numeric,
                                 NULLIF(e.price_full,0)::numeric, 0)
  END
  FROM events e WHERE e.slug = p_slug
$$;
