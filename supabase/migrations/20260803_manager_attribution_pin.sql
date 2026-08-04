-- Manager commission attribution: pin the manager onto each booking.
--
-- WHY
-- accrue_manager_sale() used to resolve "who manages this event" at the moment
-- a booking flipped to fully_paid, reading live event_managers state. Two holes
-- fell out of that:
--
--   1. Retroactive credit. Assign a manager to an event that has a backlog of
--      advance-paid tickets, and they earn on the whole backlog the moment
--      anyone clears it -- including sales closed weeks before they existed.
--      This fired live: on 2026-08-02 a bulk advance_paid -> fully_paid flip of
--      six July-19 Chill Sunday Meetup tickets accrued 6 x Rs.35 to a manager
--      assigned 2026-07-27, none of whose sales she was involved in. Those six
--      rows were reversed by hand on 2026-08-03.
--
--   2. No handover story at all. The lookup was ORDER BY em.created_at LIMIT 1
--      (earliest-assigned wins). That never actually starved a second manager,
--      because uq_event_managers_event caps an event at one manager -- adding a
--      second is rejected outright, so a handover is always remove-then-add and
--      the LIMIT 1 only ever saw one row. What was missing is what happens to
--      the outgoing manager's open leads: with nothing pinned to a booking,
--      there was nowhere to record that they changed hands. ORDER BY ... DESC
--      below is defensive only (identical behaviour while the cap holds); the
--      real fix is redistribute_event_managers() further down.
--
-- FIX
-- Mirror what marketers have always done. applications.assigned_marketer_id is
-- stamped when the lead arrives and accrue_marketer_sale() reads it off the
-- row, so a late flip still pays the right person. Managers now work the same
-- way via applications.assigned_manager_id, and "most recent assignment wins"
-- replaces "earliest wins" so handovers actually hand over.

-- 1. The pin itself.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS assigned_manager_id uuid
  REFERENCES public.managers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_applications_assigned_manager
  ON public.applications(assigned_manager_id)
  WHERE assigned_manager_id IS NOT NULL;

-- 2. Who currently manages an event. DESC (most recently assigned wins) is
--    defensive: uq_event_managers_event already caps this at one row per event,
--    so it only matters if that cap is ever lifted. Only active managers count.
CREATE OR REPLACE FUNCTION public.pick_event_manager(p_event_slug text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT em.manager_id
    FROM event_managers em
    JOIN managers m ON m.id = em.manager_id AND m.active
   WHERE em.event_slug = p_event_slug
   ORDER BY em.created_at DESC
   LIMIT 1
$$;

-- 3. Stamp the manager when the lead arrives.
CREATE OR REPLACE FUNCTION public.assign_application_manager()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assigned_manager_id IS NULL THEN
    NEW.assigned_manager_id := pick_event_manager(NEW.event_slug);
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_assign_application_manager ON public.applications;
CREATE TRIGGER trg_assign_application_manager
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.assign_application_manager();

-- 4. Handover: move leads that are still in play to the event's current
--    manager. The status guard is deliberately the same one
--    redistribute_event_marketers() uses -- a booking that has already taken
--    money keeps whoever was on it, so a handover can never rewrite who earned
--    on a converting booking.
CREATE OR REPLACE FUNCTION public.redistribute_event_managers(p_event_slug text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mgr  uuid := pick_event_manager(p_event_slug);
  v_done integer := 0;
BEGIN
  UPDATE applications
     SET assigned_manager_id = v_mgr
   WHERE event_slug = p_event_slug
     AND status NOT IN ('advance_paid','fully_paid','rejected')
     AND assigned_manager_id IS DISTINCT FROM v_mgr;
  GET DIAGNOSTICS v_done = ROW_COUNT;
  RETURN v_done;
END
$$;

CREATE OR REPLACE FUNCTION public.event_managers_changed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM redistribute_event_managers(OLD.event_slug);
    RETURN OLD;
  ELSE
    PERFORM redistribute_event_managers(NEW.event_slug);
    RETURN NEW;
  END IF;
END
$$;

DROP TRIGGER IF EXISTS trg_event_managers_changed ON public.event_managers;
CREATE TRIGGER trg_event_managers_changed
  AFTER INSERT OR DELETE ON public.event_managers
  FOR EACH ROW EXECUTE FUNCTION public.event_managers_changed();

-- Deactivating a manager also revokes their login, so their open leads must
-- fall to whoever is left rather than sit pinned to someone who can't work them.
CREATE OR REPLACE FUNCTION public.manager_active_changed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT event_slug FROM event_managers WHERE manager_id = NEW.id LOOP
    PERFORM redistribute_event_managers(r.event_slug);
  END LOOP;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_manager_active_changed ON public.managers;
CREATE TRIGGER trg_manager_active_changed
  AFTER UPDATE OF active ON public.managers
  FOR EACH ROW WHEN (OLD.active IS DISTINCT FROM NEW.active)
  EXECUTE FUNCTION public.manager_active_changed();

-- 5. Accrual now reads the pin off the row instead of asking live state.
--    No m.active check on purpose: if they were the manager when the lead was
--    theirs, they earned it, exactly as accrue_marketer_sale() treats marketers.
CREATE OR REPLACE FUNCTION public.accrue_manager_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric;
BEGIN
  IF NEW.status = 'fully_paid'
     AND OLD.status IS DISTINCT FROM 'fully_paid'
     AND NEW.assigned_manager_id IS NOT NULL
  THEN
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
$$;

-- 6. Backfill, in two deliberate passes.
--    (a) Anything that already paid a manager commission keeps that manager --
--        the history stays truthful.
UPDATE public.applications a
   SET assigned_manager_id = ms.manager_id
  FROM public.manager_sales ms
 WHERE ms.application_id = a.id
   AND a.assigned_manager_id IS DISTINCT FROM ms.manager_id;

--    (b) Leads still in play go to the event's current manager. Everything else
--        (advance_paid / fully_paid / rejected with no commission behind it) is
--        left NULL on purpose: those are pre-manager sales, and stamping them
--        would recreate the exact retroactive-credit bug this migration fixes.
UPDATE public.applications a
   SET assigned_manager_id = public.pick_event_manager(a.event_slug)
 WHERE a.assigned_manager_id IS NULL
   AND a.status NOT IN ('advance_paid','fully_paid','rejected')
   AND public.pick_event_manager(a.event_slug) IS NOT NULL;
