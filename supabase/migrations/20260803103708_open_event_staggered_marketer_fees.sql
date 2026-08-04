-- Open-event commission has two tiers. The event's marketer_commission remains
-- the full fee; a frictionless self-serve close earns half, rounded to the
-- nearest rupee. Invite-event commission remains unchanged.

-- Answer whether anything stood between an open-event lead and payment.
-- Attribution is deliberately irrelevant: any doubt, cart abandonment, or
-- failed payment makes the eventual close eligible for the full fee.
CREATE OR REPLACE FUNCTION public.open_lead_was_worked(
  p_event_slug text,
  p_phone      text,
  p_abandoned  boolean
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(p_abandoned, false)
      OR EXISTS (
           SELECT 1 FROM doubt_submissions ds
            WHERE COALESCE(
                    resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
                    resolve_event_slug(ds.event_title)
                  ) = p_event_slug
              AND right(regexp_replace(ds.phone,'\D','','g'),10)
                = right(regexp_replace(coalesce(p_phone,''),'\D','','g'),10))
      OR EXISTS (
           SELECT 1 FROM plan_doubts pd
            WHERE pd.event_slug = p_event_slug
              AND right(regexp_replace(pd.phone,'\D','','g'),10)
                = right(regexp_replace(coalesce(p_phone,''),'\D','','g'),10))
      OR EXISTS (
           SELECT 1 FROM payu_payments pp
            WHERE pp.event_slug = p_event_slug
              AND pp.status = 'failure'
              AND right(regexp_replace(pp.phone,'\D','','g'),10)
                = right(regexp_replace(coalesce(p_phone,''),'\D','','g'),10));
$$;

COMMENT ON FUNCTION public.open_lead_was_worked(text, text, boolean) IS
  'True when an open-event sale involved a doubt, cart abandonment, or failed payment; used to choose the full marketer fee tier.';

-- This helper is internal commission logic, not a client-facing RPC. The
-- accrual trigger (and later founder-only reporting) run with owner privileges.
REVOKE EXECUTE ON FUNCTION public.open_lead_was_worked(text, text, boolean)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.accrue_marketer_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_full   numeric(10,2);
  v_amount numeric(10,2);
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.assigned_marketer_id IS NOT NULL
  THEN
    SELECT COALESCE(e.marketer_commission, cm.commission_amount)
      INTO v_full
      FROM call_marketers cm
      LEFT JOIN events e ON e.slug = NEW.event_slug
     WHERE cm.id = NEW.assigned_marketer_id;

    IF v_full IS NULL THEN RETURN NEW; END IF;

    IF COALESCE(is_open_event(NEW.event_slug), false)
       AND NOT open_lead_was_worked(NEW.event_slug, NEW.phone, NEW.cart_abandoned)
    THEN
      v_amount := round(v_full / 2);
    ELSE
      v_amount := v_full;
    END IF;

    INSERT INTO marketer_sales (application_id, marketer_id, amount)
    VALUES (NEW.id, NEW.assigned_marketer_id, v_amount)
    ON CONFLICT (application_id) DO NOTHING;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION public.accrue_marketer_sale()
  FROM PUBLIC, anon, authenticated;
