-- Marketer payout settlement.
--
-- Marketers were the one commission role with no "paid out" concept: creators
-- (affiliate_sales) and managers (manager_sales) both carry a paid_out_at stamp
-- + a settle action, but marketer_sales only ever accrued. The founder ROI card
-- therefore showed a lifetime-cumulative commission that never reset after a
-- payout. This adds the same paid_out_at stamp, scoped so the founder can settle
-- one event + date at a time (matching how they actually pay out per meetup).
--
-- Nothing here mutates existing rows: paid_out_at defaults NULL (= still owed),
-- so every accrued sale — including already-paid past dates — starts "owed"
-- until the founder explicitly settles its date.

ALTER TABLE public.marketer_sales
  ADD COLUMN IF NOT EXISTS paid_out_at timestamptz;

COMMENT ON COLUMN public.marketer_sales.paid_out_at IS
  'When the founder settled this commission (paid the marketer). NULL = still owed.';

-- Partial index: the outstanding view only ever reads the unpaid rows.
CREATE INDEX IF NOT EXISTS idx_marketer_sales_unpaid
  ON public.marketer_sales(paid_out_at) WHERE paid_out_at IS NULL;

-- Outstanding (unpaid) marketer commissions, one row per event + date + marketer.
-- Founder-only (is_admin_strict returns NULL for staff/marketers/managers, so the
-- guard blocks everyone but the founders). The client groups these rows two ways:
-- a per-marketer "unpaid tickets + owed" rollup, and a per-date settle list.
CREATE OR REPLACE FUNCTION public.get_marketer_payouts_outstanding()
RETURNS TABLE(
  event_slug     text,
  event_title    text,
  selected_date  text,
  marketer_id    uuid,
  marketer_name  text,
  tickets        integer,
  amount         numeric
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
         ms.marketer_id,
         cm.name,
         count(*)::int,
         COALESCE(sum(ms.amount), 0)
  FROM public.marketer_sales ms
  JOIN public.applications a       ON a.id = ms.application_id
  LEFT JOIN public.events e        ON e.slug = a.event_slug
  LEFT JOIN public.call_marketers cm ON cm.id = ms.marketer_id
  WHERE ms.paid_out_at IS NULL
  GROUP BY a.event_slug, e.title, a.selected_date, ms.marketer_id, cm.name;
END
$$;

-- Settle every unpaid commission for one event + date (stamps paid_out_at = now()).
-- Founder-only. Idempotent: re-running settles nothing because only NULL rows are
-- touched. Returns how many tickets and how much was cleared, for the confirmation.
CREATE OR REPLACE FUNCTION public.settle_marketer_payouts(
  p_event_slug    text,
  p_selected_date text
)
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

  WITH settled AS (
    UPDATE public.marketer_sales ms
       SET paid_out_at = now()
     WHERE ms.paid_out_at IS NULL
       AND ms.application_id IN (
         SELECT a.id FROM public.applications a
         WHERE a.event_slug = p_event_slug
           AND a.selected_date IS NOT DISTINCT FROM p_selected_date
       )
    RETURNING ms.amount
  )
  SELECT count(*), COALESCE(sum(amount), 0) INTO v_count, v_amount FROM settled;

  RETURN jsonb_build_object('settled_count', v_count, 'settled_amount', v_amount);
END
$$;

REVOKE ALL ON FUNCTION public.get_marketer_payouts_outstanding()      FROM public, anon;
REVOKE ALL ON FUNCTION public.settle_marketer_payouts(text, text)     FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_marketer_payouts_outstanding()   TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_marketer_payouts(text, text)  TO authenticated;
