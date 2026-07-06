-- ============================================================================
-- Open-event marketer assignment: humans for doubts only, never cold leads
-- ============================================================================
-- Open events (booking_url='payu-hosted') are meant to scale self-serve, with
-- NO marketer attached to a lead just for showing up or paying. A marketer is
-- assigned ONLY when a human is actually needed: the lead asks a doubt.
--   * application INSERT -> NO round-robin for open events (invite unchanged)
--   * plan_doubts INSERT -> assign the person's open application (invite return)
--   * doubt_submissions  -> assign the doubt AND anchor the application
-- Commission then follows for free: only doubt-askers are ever assigned, so
-- only they can pay a marketer on conversion.
--
-- Cold abandoners still get the automated cart-abandon WhatsApp (no human);
-- there is deliberately NO auto-assignment for abandonment.

-- ── Helper: is this event an open (payu-hosted) event? ───────────────────────
CREATE OR REPLACE FUNCTION public.is_open_event(p_event_slug text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT booking_url = 'payu-hosted' FROM events WHERE slug = p_event_slug LIMIT 1
$$;

-- ── application INSERT: skip round-robin for open events ──────────────────────
-- Invite events: unchanged (inherit a prior doubt's marketer, else round-robin).
-- Open events: still inherit a prior doubt's marketer if one exists (a doubt
-- already meant a human was pulled in), but NEVER round-robin a fresh open lead.
CREATE OR REPLACE FUNCTION public.assign_application_marketer()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_phone    text;
  v_marketer uuid;
BEGIN
  IF NEW.assigned_marketer_id IS NOT NULL THEN RETURN NEW; END IF;
  v_phone := right(regexp_replace(coalesce(NEW.phone,''),'\D','','g'),10);

  -- inherit an existing doubt's marketer for this person+event (both flows)
  SELECT ds.assigned_marketer_id INTO v_marketer
    FROM doubt_submissions ds
   WHERE right(regexp_replace(ds.phone,'\D','','g'),10) = v_phone
     AND resolve_event_slug(ds.event_title) = NEW.event_slug
     AND ds.assigned_marketer_id IS NOT NULL
   LIMIT 1;

  -- round-robin fallback: invite events only. Open leads stay unassigned.
  IF v_marketer IS NULL AND NOT COALESCE(is_open_event(NEW.event_slug), false) THEN
    v_marketer := pick_marketer_round_robin(NEW.event_slug);
  END IF;

  NEW.assigned_marketer_id := v_marketer;
  RETURN NEW;
END
$$;

-- ── doubt_submissions INSERT: assign the doubt AND anchor the application ──────
-- Doubt-row assignment is unchanged (inherit app -> inherit other doubt ->
-- round-robin). NEW: also stamp the same marketer onto the person's still-
-- unassigned application for this event, so a later conversion pays commission
-- to whoever fielded the doubt. Guarded so it can never block the doubt insert.
CREATE OR REPLACE FUNCTION public.assign_doubt_submission_marketer()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_slug      text;
  v_phone     text;
  v_marketer  uuid;
  v_marketers uuid[];
  v_n         integer;
  v_count     integer;
BEGIN
  IF NEW.assigned_marketer_id IS NOT NULL THEN RETURN NEW; END IF;
  v_slug := resolve_event_slug(NEW.event_title);
  IF v_slug IS NULL THEN RETURN NEW; END IF;
  v_phone := right(regexp_replace(coalesce(NEW.phone,''), '\D', '', 'g'), 10);

  -- 1) their application for this event
  SELECT a.assigned_marketer_id INTO v_marketer
    FROM applications a
   WHERE right(regexp_replace(a.phone,'\D','','g'),10) = v_phone
     AND a.event_slug = v_slug
     AND a.assigned_marketer_id IS NOT NULL
   ORDER BY a.created_at LIMIT 1;

  -- 2) another doubt of theirs for this event
  IF v_marketer IS NULL THEN
    SELECT ds.assigned_marketer_id INTO v_marketer
      FROM doubt_submissions ds
     WHERE right(regexp_replace(ds.phone,'\D','','g'),10) = v_phone
       AND resolve_event_slug(ds.event_title) = v_slug
       AND ds.assigned_marketer_id IS NOT NULL
     LIMIT 1;
  END IF;

  -- 3) round-robin across active marketers on the event
  IF v_marketer IS NULL THEN
    SELECT array_agg(cm.id ORDER BY cm.id) INTO v_marketers
      FROM event_marketers em JOIN call_marketers cm ON cm.id = em.marketer_id
     WHERE em.event_slug = v_slug AND cm.active = true;
    IF v_marketers IS NOT NULL AND array_length(v_marketers,1) > 0 THEN
      v_n := array_length(v_marketers,1);
      SELECT count(*) INTO v_count FROM doubt_submissions
        WHERE resolve_event_slug(event_title) = v_slug AND assigned_marketer_id IS NOT NULL;
      v_marketer := v_marketers[(v_count % v_n) + 1];
    END IF;
  END IF;

  NEW.assigned_marketer_id := v_marketer;

  -- anchor the person's application (only if it exists and is still unassigned)
  IF v_marketer IS NOT NULL THEN
    BEGIN
      UPDATE applications a
         SET assigned_marketer_id = v_marketer
       WHERE a.event_slug = v_slug
         AND right(regexp_replace(a.phone,'\D','','g'),10) = v_phone
         AND a.assigned_marketer_id IS NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  RETURN NEW;
END
$$;

-- ── plan_doubts INSERT: assign the person's open application ───────────────────
-- Invite-flow "Other topic" doubt. For OPEN events (a lead who returned via
-- /invite from the cart-abandon nudge and asked something), assign a marketer
-- onto their application if it has none yet — preferring one they already have
-- on a doubt, else round-robin. No-op for invite events (already assigned at
-- insert) and when no marketers are mapped. Guarded so it can never block the
-- doubt from saving.
CREATE OR REPLACE FUNCTION public.assign_app_from_plan_doubt()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_phone    text;
  v_marketer uuid;
BEGIN
  IF NOT COALESCE(is_open_event(NEW.event_slug), false) THEN RETURN NEW; END IF;
  v_phone := right(regexp_replace(coalesce(NEW.phone,''),'\D','','g'),10);

  -- prefer a marketer this person already has on a doubt for this event
  SELECT ds.assigned_marketer_id INTO v_marketer
    FROM doubt_submissions ds
   WHERE right(regexp_replace(ds.phone,'\D','','g'),10) = v_phone
     AND resolve_event_slug(ds.event_title) = NEW.event_slug
     AND ds.assigned_marketer_id IS NOT NULL
   LIMIT 1;
  IF v_marketer IS NULL THEN
    v_marketer := pick_marketer_round_robin(NEW.event_slug);
  END IF;
  IF v_marketer IS NULL THEN RETURN NEW; END IF;

  BEGIN
    UPDATE applications a
       SET assigned_marketer_id = v_marketer
     WHERE a.event_slug = NEW.event_slug
       AND right(regexp_replace(a.phone,'\D','','g'),10) = v_phone
       AND a.assigned_marketer_id IS NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_assign_app_from_plan_doubt ON public.plan_doubts;
CREATE TRIGGER trg_assign_app_from_plan_doubt
  AFTER INSERT ON public.plan_doubts
  FOR EACH ROW EXECUTE FUNCTION public.assign_app_from_plan_doubt();

-- ── redistribute_event_marketers: never sweep in cold open leads ──────────────
-- For OPEN events, only rebalance people who ALREADY have a marketer (assigned
-- via a doubt). Cold self-serve leads (unassigned) stay unassigned even when an
-- admin adds/removes a marketer on the event. Invite events unchanged.
CREATE OR REPLACE FUNCTION public.redistribute_event_marketers(p_event_slug text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_marketers uuid[];
  v_n         integer;
  v_rec       record;
  v_idx       integer := 0;
  v_done      integer := 0;
  v_marketer  uuid;
  v_is_open   boolean := COALESCE(is_open_event(p_event_slug), false);
BEGIN
  SELECT array_agg(cm.id ORDER BY cm.id) INTO v_marketers
    FROM event_marketers em JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = p_event_slug AND cm.active = true;
  IF v_marketers IS NULL OR array_length(v_marketers,1) = 0 THEN RETURN 0; END IF;
  v_n := array_length(v_marketers,1);

  -- Step A: doubts of CONVERTED-application people follow that app's marketer.
  UPDATE doubt_submissions ds
     SET assigned_marketer_id = a.assigned_marketer_id
    FROM applications a
   WHERE a.event_slug = p_event_slug
     AND a.status IN ('advance_paid','fully_paid')
     AND right(regexp_replace(a.phone,'\D','','g'),10) = right(regexp_replace(ds.phone,'\D','','g'),10)
     AND resolve_event_slug(ds.event_title) = p_event_slug;

  -- Step B: deal people round-robin; app + doubts together. For OPEN events,
  -- restrict to people who ALREADY have a marketer (doubt-askers) so cold
  -- self-serve leads are never assigned.
  FOR v_rec IN
    SELECT phone10, min(seen) AS first_seen
    FROM (
      SELECT right(regexp_replace(phone,'\D','','g'),10) AS phone10, created_at AS seen
        FROM applications
       WHERE event_slug = p_event_slug AND status NOT IN ('advance_paid','fully_paid','rejected')
      UNION ALL
      SELECT right(regexp_replace(phone,'\D','','g'),10), submitted_at
        FROM doubt_submissions
       WHERE resolve_event_slug(event_title) = p_event_slug
    ) u
    WHERE phone10 NOT IN (
      SELECT right(regexp_replace(phone,'\D','','g'),10)
        FROM applications
       WHERE event_slug = p_event_slug AND status IN ('advance_paid','fully_paid')
    )
    AND (
      NOT v_is_open
      OR phone10 IN (
        SELECT right(regexp_replace(phone,'\D','','g'),10) FROM applications
          WHERE event_slug = p_event_slug AND assigned_marketer_id IS NOT NULL
        UNION
        SELECT right(regexp_replace(phone,'\D','','g'),10) FROM doubt_submissions
          WHERE resolve_event_slug(event_title) = p_event_slug AND assigned_marketer_id IS NOT NULL
      )
    )
    GROUP BY phone10
    ORDER BY first_seen, phone10
  LOOP
    v_marketer := v_marketers[(v_idx % v_n) + 1];
    UPDATE applications
       SET assigned_marketer_id = v_marketer
     WHERE event_slug = p_event_slug
       AND status NOT IN ('advance_paid','fully_paid','rejected')
       AND right(regexp_replace(phone,'\D','','g'),10) = v_rec.phone10;
    UPDATE doubt_submissions
       SET assigned_marketer_id = v_marketer
     WHERE resolve_event_slug(event_title) = p_event_slug
       AND right(regexp_replace(phone,'\D','','g'),10) = v_rec.phone10;
    v_idx := v_idx + 1;
    v_done := v_done + 1;
  END LOOP;

  RETURN v_done;
END
$$;
