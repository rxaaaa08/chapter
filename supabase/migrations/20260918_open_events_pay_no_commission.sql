-- Open events pay NO marketer and NO manager commission.
--
-- THE DECISION
-- The owner decided this on 2026-08-10 and restated it on 2026-09-18 with
-- "for open events no need to pay to marketers or managers. Fix this."
-- His reasoning, from 2026-08-10: an open event is fully self-serve, and a lead
-- fee on a ~₹300 self-serve ticket pushes the event to break-even. Open events
-- carry only the hosting cost, and the strategy is volume — run many more of
-- them and profit on volume rather than per-ticket margin.
--
-- WHY THIS MIGRATION EXISTS AT ALL
-- The decision was never in the code. It appears to have been implemented by
-- clearing `events.marketer_commission`, which does the OPPOSITE of stopping
-- payment: both accrual triggers read
--     COALESCE(events.<role>_commission, <person>.commission_amount)
-- so a NULL on the event falls through to the PERSON's own rate. Measured on
-- production 2026-09-18, accrued on open events since 2026-08-10:
--   * marketer ₹875  — Anna Nagar ₹500 across 7 marketers (all paid out),
--                      Kovalam ₹325 to the owner's own marketer account (unpaid)
--   * manager  ₹385  — Anna Nagar, one manager (unpaid)
-- and it was not finished: `event_managers` still maps a manager to
-- anna-nagar-meetup, so each of its ~111 unpaid leads would have accrued ₹35 on
-- payment, plus three older bookings still carrying a marketer stamp.
--
-- WHY THE FIX IS IN THE TRIGGER AND NOT IN THE MAPPINGS
-- Assignment happens at LEAD time and the owner id is stamped on the row
-- (see the commission-attribution pin in CLAUDE.md), so unmapping a marketer or
-- manager today would NOT stop already-stamped leads from accruing when they
-- pay. Only the accrual itself is a reliable place to say no. Assignment is also
-- deliberately left alone: a manager on an open event still owns the lead, the
-- daily brief and the scorecards. This changes the MONEY, not the ops.
--
-- WHAT IS NOT CHANGED, ON PURPOSE
--   * Creator/affiliate commission still accrues on open events — untouched,
--     the owner said nothing about creators and their links are how open events
--     get sold.
--   * Invite events (`booking_url = 'native-application'`, e.g. Pondy) are
--     unchanged and still pay both roles.
--   * Rows already accrued are left exactly as they are. Reversing money that
--     has been paid out is the owner's call, not a migration's.
--   * `get_performance_summary` (Finances) still FORECASTS a commission on open
--     events. That is a separate, display-side change and is being raised with
--     the owner rather than bundled in here.

create or replace function public.accrue_marketer_sale()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_full   numeric(10,2);
  v_amount numeric(10,2);
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.assigned_marketer_id IS NOT NULL
  THEN
    -- OPEN EVENTS PAY NOTHING. Owner's decision, 2026-08-10, restated
    -- 2026-09-18. This is the one line that enforces it; do not remove it
    -- without him asking, and do not try to enforce it by clearing
    -- events.marketer_commission instead — a NULL there falls through to the
    -- marketer's own rate, which is exactly how ₹875 was paid by accident.
    IF COALESCE(is_open_event(NEW.event_slug), false) THEN
      RETURN NEW;
    END IF;

    SELECT COALESCE(e.marketer_commission, cm.commission_amount)
      INTO v_full
      FROM call_marketers cm
      LEFT JOIN events e ON e.slug = NEW.event_slug
     WHERE cm.id = NEW.assigned_marketer_id;

    IF v_full IS NULL THEN RETURN NEW; END IF;

    -- UNREACHABLE while the rule above holds, and kept deliberately. This is
    -- the two-tier open-event fee (half for a self-serve lead, full for one a
    -- marketer actually worked) built on 2026-08-04. Keeping it means
    -- reinstating open-event commission is deleting the guard above, not
    -- rebuilding this.
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
$function$;

create or replace function public.accrue_manager_sale()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_amount numeric;
BEGIN
  IF NEW.status = 'fully_paid'
     AND OLD.status IS DISTINCT FROM 'fully_paid'
     AND NEW.assigned_manager_id IS NOT NULL
  THEN
    -- OPEN EVENTS PAY NOTHING. Same decision, same warning as the marketer
    -- trigger above: the manager keeps owning the lead, the brief and the
    -- scorecard, and earns nothing on it.
    IF COALESCE(is_open_event(NEW.event_slug), false) THEN
      RETURN NEW;
    END IF;

    SELECT COALESCE(e.manager_commission, m.commission_amount)
      INTO v_amount
      FROM managers m
      LEFT JOIN events e ON e.slug = NEW.event_slug
     WHERE m.id = NEW.assigned_manager_id;
    IF v_amount IS NOT NULL THEN
      INSERT INTO manager_sales (application_id, manager_id, amount)
      VALUES (NEW.id, NEW.assigned_manager_id, v_amount)
      ON CONFLICT (application_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END
$function$;

comment on function public.accrue_marketer_sale() is
  'Marketer commission on a fully_paid flip. OPEN EVENTS ACCRUE NOTHING '
  '(owner, 2026-08-10 and 2026-09-18). Invite events unchanged. Never enforce '
  'the open-event rule by clearing events.marketer_commission: NULL there falls '
  'through to the marketer''s own commission_amount.';

comment on function public.accrue_manager_sale() is
  'Manager commission on a fully_paid flip. OPEN EVENTS ACCRUE NOTHING '
  '(owner, 2026-08-10 and 2026-09-18). Assignment is untouched — a manager '
  'still owns open-event leads for the brief and scorecards, unpaid.';
