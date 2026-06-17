-- current_marketer_id: JWT-email lookup against call_marketers. Returns
-- NULL when the caller is admin-only / a non-marketer ops user / anon.
CREATE OR REPLACE FUNCTION public.current_marketer_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT id FROM call_marketers
  WHERE email = (auth.jwt() ->> 'email')
    AND active = true
$$;

-- is_admin_only: a tighter form of is_admin() that excludes users who are
-- also marketers. Used to swap into existing applications RLS so a marketer
-- can't see everyone's leads via the broader is_admin() rule.
CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT is_admin() AND current_marketer_id() IS NULL
$$;

-- pick_marketer_round_robin: given event_slug, picks the next marketer for
-- assignment. Order: call_marketers.id ASC for determinism. Rotation: count
-- of existing applications for the event with non-null assigned_marketer_id,
-- mod n. Returns NULL when no active marketers are assigned to the event.
CREATE OR REPLACE FUNCTION public.pick_marketer_round_robin(p_event_slug text)
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_marketers uuid[];
  v_count     integer;
  v_n         integer;
BEGIN
  SELECT array_agg(cm.id ORDER BY cm.id)
    INTO v_marketers
    FROM event_marketers em
    JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = p_event_slug AND cm.active = true;

  IF v_marketers IS NULL THEN RETURN NULL; END IF;
  v_n := array_length(v_marketers, 1);
  IF v_n = 0 THEN RETURN NULL; END IF;

  SELECT count(*) INTO v_count
    FROM applications
   WHERE event_slug = p_event_slug
     AND assigned_marketer_id IS NOT NULL;

  RETURN v_marketers[(v_count % v_n) + 1]; -- arrays are 1-indexed
END
$$;

-- BEFORE INSERT trigger: assign marketer on new applications. No-op if
-- already set (defensive — admin path won't set it, but allows it).
CREATE OR REPLACE FUNCTION public.assign_application_marketer()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assigned_marketer_id IS NULL THEN
    NEW.assigned_marketer_id := pick_marketer_round_robin(NEW.event_slug);
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_assign_application_marketer ON public.applications;
CREATE TRIGGER trg_assign_application_marketer
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.assign_application_marketer();

-- redistribute_event_marketers: re-deals ALL unconverted leads of an event
-- round-robin across its active marketers. Called when admin assigns/removes
-- a marketer (event_marketers change) or a marketer goes inactive.
--
-- Rules:
--   * Re-deals every row whose status is NOT IN ('advance_paid','fully_paid',
--     'rejected'), ordered by created_at, for a deterministic even split.
--     This is a full rebalance — adding a 2nd marketer re-splits the existing
--     load, not just the orphans.
--   * Converted (advance_paid/fully_paid) + rejected keep their owner —
--     commission attribution must not move.
CREATE OR REPLACE FUNCTION public.redistribute_event_marketers(p_event_slug text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_marketers uuid[];
  v_n         integer;
  v_row       record;
  v_idx       integer := 0;
  v_done      integer := 0;
BEGIN
  SELECT array_agg(cm.id ORDER BY cm.id)
    INTO v_marketers
    FROM event_marketers em
    JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = p_event_slug AND cm.active = true;

  IF v_marketers IS NULL OR array_length(v_marketers, 1) = 0 THEN
    RETURN 0;
  END IF;
  v_n := array_length(v_marketers, 1);

  FOR v_row IN
    SELECT a.id
      FROM applications a
     WHERE a.event_slug = p_event_slug
       AND a.status NOT IN ('advance_paid','fully_paid','rejected')
     ORDER BY a.created_at
  LOOP
    UPDATE applications
       SET assigned_marketer_id = v_marketers[(v_idx % v_n) + 1]
     WHERE id = v_row.id;
    v_idx := v_idx + 1;
    v_done := v_done + 1;
  END LOOP;

  RETURN v_done;
END
$$;

-- Auto-redistribute when event_marketers changes (admin added or removed a
-- marketer from the event from the admin UI).
CREATE OR REPLACE FUNCTION public.event_marketers_changed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM redistribute_event_marketers(OLD.event_slug);
    RETURN OLD;
  ELSE
    PERFORM redistribute_event_marketers(NEW.event_slug);
    RETURN NEW;
  END IF;
END
$$;

DROP TRIGGER IF EXISTS trg_event_marketers_changed ON public.event_marketers;
CREATE TRIGGER trg_event_marketers_changed
  AFTER INSERT OR DELETE ON public.event_marketers
  FOR EACH ROW EXECUTE FUNCTION public.event_marketers_changed();

-- Auto-redistribute when a marketer is deactivated (active flips true->false).
-- Re-runs for each event they were on.
CREATE OR REPLACE FUNCTION public.call_marketer_deactivated()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_event text;
BEGIN
  IF OLD.active = true AND NEW.active = false THEN
    FOR v_event IN SELECT event_slug FROM event_marketers WHERE marketer_id = NEW.id
    LOOP
      PERFORM redistribute_event_marketers(v_event);
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_call_marketer_deactivated ON public.call_marketers;
CREATE TRIGGER trg_call_marketer_deactivated
  AFTER UPDATE OF active ON public.call_marketers
  FOR EACH ROW EXECUTE FUNCTION public.call_marketer_deactivated();

-- AFTER UPDATE trigger: when status flips to fully_paid, log a sale row.
-- Idempotent via UNIQUE(application_id) on marketer_sales — if somehow the
-- status flips twice, the duplicate insert is silently swallowed.
CREATE OR REPLACE FUNCTION public.accrue_marketer_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric(10,2);
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.assigned_marketer_id IS NOT NULL
  THEN
    SELECT commission_amount INTO v_amount FROM call_marketers WHERE id = NEW.assigned_marketer_id;
    IF v_amount IS NOT NULL THEN
      INSERT INTO marketer_sales (application_id, marketer_id, amount)
      VALUES (NEW.id, NEW.assigned_marketer_id, v_amount)
      ON CONFLICT (application_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_accrue_marketer_sale ON public.applications;
CREATE TRIGGER trg_accrue_marketer_sale
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.accrue_marketer_sale();
