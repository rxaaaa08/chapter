-- Creator payout settlement: one event + date at a time, every creator on it.
--
-- Until now a creator's commission could only be cleared all at once from the
-- All creators table ("Mark paid" stamped every unpaid affiliate_sales row for
-- that creator), and the table showed a lifetime Earned figure with no way to
-- see which event or date it came from. The founder pays creators the way they
-- pay marketers — after each meetup — so creators now get the same
-- settle-a-date model as get_marketer_payouts_outstanding /
-- settle_marketer_payouts (20260727_marketer_payout_settlement.sql).
--
-- Two deliberate differences from the marketer version:
--
-- 1. Settling passes the exact sale ids the founder was looking at, not
--    (event, date). A single-payment event keeps accruing sales right up to its
--    date, so settling by (event, date) at click time could mark a ticket paid
--    that arrived after the page loaded and was never actually paid. Ids settle
--    exactly what was on screen; anything newer stays owed.
--
-- 2. An undo. The old Mark paid could not be reversed, so a mis-tap recorded a
--    payment that never happened. unsettle clears only rows stamped at that
--    exact settle moment, so it can never un-pay an earlier settlement.
--
-- Nothing here mutates existing rows or adds a column: affiliate_sales.paid_out_at
-- and its unpaid-only partial index (idx_affiliate_sales_unpaid) already exist.

-- Outstanding (unpaid) creator commission, one row per event + date + creator.
-- Founder-only (is_admin_strict returns NULL for staff/marketers/managers, so the
-- guard blocks everyone but the founders). The client groups these rows two ways:
-- a per-creator "owed, broken down by event + date" table, and a per-date settle
-- list. sale_ids lets the settle action clear exactly the rows shown.
CREATE OR REPLACE FUNCTION public.get_creator_payouts_outstanding()
RETURNS TABLE(
  event_slug       text,
  event_title      text,
  selected_date    text,
  affiliate_id     uuid,
  affiliate_name   text,
  affiliate_handle text,
  upi_id           text,
  tickets          integer,
  amount           numeric,
  sale_ids         uuid[]
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT COALESCE(is_admin_strict(), false) THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT a.event_slug,
         e.title,
         a.selected_date,
         s.affiliate_id,
         af.name,
         af.handle,
         af.upi_id,
         count(*)::int,
         COALESCE(sum(s.amount), 0),
         array_agg(s.id ORDER BY s.accrued_at)
  FROM public.affiliate_sales s
  JOIN public.applications a ON a.id = s.application_id
  JOIN public.affiliates af  ON af.id = s.affiliate_id
  LEFT JOIN public.events e  ON e.slug = a.event_slug
  WHERE s.paid_out_at IS NULL
  GROUP BY a.event_slug, e.title, a.selected_date, s.affiliate_id, af.name, af.handle, af.upi_id;
END
$$;

-- Settle the given unpaid sales (stamps paid_out_at = now()). Founder-only.
-- Idempotent: already-paid ids are skipped. Returns the ids it actually stamped
-- and the stamp itself, which is what unsettle needs to reverse exactly this call.
CREATE OR REPLACE FUNCTION public.settle_creator_payouts(p_sale_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_now    timestamptz := now();
  v_ids    uuid[];
  v_amount numeric;
BEGIN
  IF NOT COALESCE(is_admin_strict(), false) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH settled AS (
    UPDATE public.affiliate_sales s
       SET paid_out_at = v_now
     WHERE s.id = ANY(p_sale_ids)
       AND s.paid_out_at IS NULL
    RETURNING s.id, s.amount
  )
  SELECT COALESCE(array_agg(id), '{}'), COALESCE(sum(amount), 0) INTO v_ids, v_amount FROM settled;

  RETURN jsonb_build_object(
    'settled_count',  cardinality(v_ids),
    'settled_amount', v_amount,
    'paid_out_at',    v_now,
    'sale_ids',       to_jsonb(v_ids)
  );
END
$$;

-- Undo one settle: clears paid_out_at only on the given ids that still carry
-- that settle's exact stamp. Founder-only.
CREATE OR REPLACE FUNCTION public.unsettle_creator_payouts(p_sale_ids uuid[], p_paid_out_at timestamptz)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_count  integer;
  v_amount numeric;
BEGIN
  IF NOT COALESCE(is_admin_strict(), false) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH reopened AS (
    UPDATE public.affiliate_sales s
       SET paid_out_at = NULL
     WHERE s.id = ANY(p_sale_ids)
       AND s.paid_out_at = p_paid_out_at
    RETURNING s.amount
  )
  SELECT count(*), COALESCE(sum(amount), 0) INTO v_count, v_amount FROM reopened;

  RETURN jsonb_build_object('reopened_count', v_count, 'reopened_amount', v_amount);
END
$$;

REVOKE ALL ON FUNCTION public.get_creator_payouts_outstanding()                FROM public, anon;
REVOKE ALL ON FUNCTION public.settle_creator_payouts(uuid[])                   FROM public, anon;
REVOKE ALL ON FUNCTION public.unsettle_creator_payouts(uuid[], timestamptz)    FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_creator_payouts_outstanding()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_creator_payouts(uuid[])                TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsettle_creator_payouts(uuid[], timestamptz) TO authenticated;
