-- ============================================================================
-- Doubt-submission marketer ownership (pre-application doubts)
-- ============================================================================
-- doubt_submissions are the booking-flow "Other topic" doubts asked BEFORE a
-- person applies (shown in the admin People → Doubts tab). They are now split
-- across marketers the same way applications are, with one rule on top:
-- a person's doubt and their eventual application for the same event ALWAYS
-- belong to the same marketer (end-to-end ownership). See multi-marketer.md.
--
-- (plan_doubts — the invite-flow "Other topic" doubts shown as amber cards in
-- the Call section — are NOT touched here: they ride along with the already-
-- scoped application row they attach to.)

-- ── Schema ──────────────────────────────────────────────────────────────────
ALTER TABLE public.doubt_submissions
  ADD COLUMN IF NOT EXISTS assigned_marketer_id uuid REFERENCES public.call_marketers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_doubt_submissions_assigned_marketer
  ON public.doubt_submissions(assigned_marketer_id);

-- ── Helper: event_title → slug ───────────────────────────────────────────────
-- doubt_submissions only stores event_title, no slug. Resolve it so doubts can
-- be scoped per event. Prefers a title match, falls back to slug match.
CREATE OR REPLACE FUNCTION public.resolve_event_slug(p_title text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT slug FROM events
   WHERE lower(title) = lower(p_title) OR lower(slug) = lower(p_title)
   ORDER BY (lower(title) = lower(p_title)) DESC
   LIMIT 1
$$;

-- ── BEFORE INSERT on doubt_submissions ───────────────────────────────────────
-- Keep a person whole per event: 1) inherit their application's marketer,
-- 2) else another of their doubts' marketer, 3) else round-robin.
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

  SELECT a.assigned_marketer_id INTO v_marketer
    FROM applications a
   WHERE right(regexp_replace(a.phone,'\D','','g'),10) = v_phone
     AND a.event_slug = v_slug
     AND a.assigned_marketer_id IS NOT NULL
   ORDER BY a.created_at LIMIT 1;

  IF v_marketer IS NULL THEN
    SELECT ds.assigned_marketer_id INTO v_marketer
      FROM doubt_submissions ds
     WHERE right(regexp_replace(ds.phone,'\D','','g'),10) = v_phone
       AND resolve_event_slug(ds.event_title) = v_slug
       AND ds.assigned_marketer_id IS NOT NULL
     LIMIT 1;
  END IF;

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
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_assign_doubt_submission_marketer ON public.doubt_submissions;
CREATE TRIGGER trg_assign_doubt_submission_marketer
  BEFORE INSERT ON public.doubt_submissions
  FOR EACH ROW EXECUTE FUNCTION public.assign_doubt_submission_marketer();

-- ── BEFORE INSERT on applications (updated) ───────────────────────────────────
-- Inherit an existing doubt's marketer for the same person+event before
-- falling back to round-robin (so approving/applying after a doubt keeps the
-- same owner).
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

  SELECT ds.assigned_marketer_id INTO v_marketer
    FROM doubt_submissions ds
   WHERE right(regexp_replace(ds.phone,'\D','','g'),10) = v_phone
     AND resolve_event_slug(ds.event_title) = NEW.event_slug
     AND ds.assigned_marketer_id IS NOT NULL
   LIMIT 1;

  IF v_marketer IS NULL THEN
    v_marketer := pick_marketer_round_robin(NEW.event_slug);
  END IF;

  NEW.assigned_marketer_id := v_marketer;
  RETURN NEW;
END
$$;

-- ── redistribute_event_marketers (rewritten: by person, both tables) ──────────
-- Re-deals an event's people across active marketers, keeping each person
-- whole (their unconverted application AND doubts go to the same marketer).
-- Converted-application people are fixed (their doubts follow that marketer;
-- not reshuffled — commission integrity). Dealt by phone, ordered first-seen.
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

  -- Step B: deal FREE people (no converted app) round-robin; app + doubts together.
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

-- ── RLS: scope the Doubts tab ─────────────────────────────────────────────────
-- Admins (non-marketers) see all; marketers see only their own assigned doubts.
ALTER POLICY doubt_submissions_admin_select ON public.doubt_submissions
  USING (is_admin_only());

CREATE POLICY doubt_submissions_marketer_select ON public.doubt_submissions
  FOR SELECT TO authenticated
  USING (current_marketer_id() IS NOT NULL AND assigned_marketer_id = current_marketer_id());
