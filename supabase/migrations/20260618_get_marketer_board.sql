-- Transparent team board for the marketer's People tab: every active marketer's
-- tickets sold (advance_paid + fully_paid assigned leads) and earned commission,
-- all-time. SECURITY DEFINER so a marketer (who otherwise only sees their own
-- data) can read peers' name + totals — name/tickets/earned ONLY, never phone,
-- email, or lead lists. Not a ranking; just an honest team-wide display.
CREATE OR REPLACE FUNCTION public.get_marketer_board()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'marketer_id',  cm.id,
    'name',         cm.name,
    'tickets_sold', COALESCE(t.tickets, 0),
    -- ESTIMATED earning (tickets × commission), not actual — avoids a
    -- demotivating ₹0 before balances are paid. Actual payout is on full payment.
    'estimated_earning', COALESCE(t.tickets, 0) * cm.commission_amount
  ) ORDER BY COALESCE(t.tickets,0) DESC, cm.name), '[]'::jsonb)
  FROM call_marketers cm
  LEFT JOIN (
    SELECT assigned_marketer_id AS mid, count(*) AS tickets
    FROM applications
    WHERE status IN ('advance_paid','fully_paid') AND assigned_marketer_id IS NOT NULL
    GROUP BY assigned_marketer_id
  ) t ON t.mid = cm.id
  WHERE cm.active = true
$$;

REVOKE ALL ON FUNCTION public.get_marketer_board() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketer_board() TO authenticated, service_role;
