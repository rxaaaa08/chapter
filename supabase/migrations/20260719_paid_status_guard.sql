-- Founder decision (2026-07-19 clarity round): all real money flows through
-- PayU — a paid status set by hand is either a mistake or commission gaming
-- (marketer/manager commission accrues the moment status hits fully_paid).
-- Only the payment system (service role / no-JWT contexts like SQL & cron)
-- and founders may move a lead INTO advance_paid / fully_paid. Everything
-- else marketers and managers do with leads is untouched, and no admin-panel
-- flow ever sets a paid status client-side (verified: the UI only writes
-- 'invited'), so this guards without breaking anything.

CREATE OR REPLACE FUNCTION public.guard_paid_status_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('advance_paid','fully_paid')
     AND (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status) THEN
    IF auth.jwt() IS NULL                          -- direct SQL / pg_cron
       OR (auth.jwt() ->> 'role') = 'service_role' -- payment webhook
       OR is_admin_strict() THEN                   -- founders
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'paid statuses are set by the payment system — ask a founder for manual corrections';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_paid_status ON public.applications;
CREATE TRIGGER trg_guard_paid_status
  BEFORE INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_paid_status_change();
