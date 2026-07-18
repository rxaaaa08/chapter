-- ── Targeted marketer redistribution (2026-07-18 owner decision) ──────────────
--
-- Before: any change to an event's marketer list (add OR remove) re-dealt
-- EVERY unconverted lead of the event round-robin across the current active
-- marketers — so removing marketer C also swapped leads between A and B,
-- breaking mid-conversation continuity.
--
-- New rules:
--   * REMOVE a marketer from an event (or deactivate them globally):
--     only THAT marketer's unconverted leads move. Each is handed to
--     whichever remaining marketer currently holds the fewest unconverted
--     leads, so the split stays fair. Nobody else's leads are touched.
--   * ADD a marketer to an event: they receive ONLY orphaned leads —
--     leads with no assigned marketer, or assigned to someone no longer
--     active on the event. Existing assignments never move. New incoming
--     leads still reach them via the round-robin INSERT trigger.
--   * Removing the LAST marketer nulls their leads' assignment, so a
--     future add adopts them as orphans instead of leaving them stranded.
--   * Unchanged protections: advance_paid / fully_paid / rejected never
--     move (commission attribution is sacred), and OPEN events still never
--     assign cold leads — only phones with a doubt_submissions row qualify.
--
-- Builds on the live definition (= 20260706_open_event_marketer_assignment.sql):
-- person-level (phone) grouping across applications + doubt_submissions,
-- converted-phone doubt sync, and the open-event gate are all kept.

-- Old single-arg signature must go so the new default-param one is the only
-- resolution target (the trigger bodies below call it with two args anyway).
DROP FUNCTION IF EXISTS public.redistribute_event_marketers(text);

CREATE OR REPLACE FUNCTION public.redistribute_event_marketers(
  p_event_slug text,
  p_removed_marketer uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_marketers uuid[];
  v_loads     integer[];
  v_load      integer;
  v_n         integer;
  v_rec       record;
  v_pick      integer;
  v_i         integer;
  v_done      integer := 0;
  v_is_open   boolean := COALESCE(is_open_event(p_event_slug), false);
BEGIN
  SELECT array_agg(cm.id ORDER BY cm.id) INTO v_marketers
    FROM event_marketers em JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = p_event_slug AND cm.active = true;

  -- Doubts of converted phones always mirror the converting application's
  -- marketer (kept from the live version).
  UPDATE doubt_submissions ds
     SET assigned_marketer_id = a.assigned_marketer_id
    FROM applications a
   WHERE a.event_slug = p_event_slug
     AND a.status IN ('advance_paid','fully_paid')
     AND right(regexp_replace(a.phone,'\D','','g'),10) = right(regexp_replace(ds.phone,'\D','','g'),10)
     AND resolve_event_slug(ds.event_title) = p_event_slug;

  IF v_marketers IS NULL OR array_length(v_marketers,1) = 0 THEN
    -- No active marketers remain. On a removal, orphan the removed
    -- marketer's unconverted leads so a future add can adopt them.
    IF p_removed_marketer IS NOT NULL THEN
      UPDATE applications
         SET assigned_marketer_id = NULL
       WHERE event_slug = p_event_slug
         AND assigned_marketer_id = p_removed_marketer
         AND status NOT IN ('advance_paid','fully_paid','rejected');
      GET DIAGNOSTICS v_done = ROW_COUNT;
      UPDATE doubt_submissions
         SET assigned_marketer_id = NULL
       WHERE resolve_event_slug(event_title) = p_event_slug
         AND assigned_marketer_id = p_removed_marketer
         AND right(regexp_replace(phone,'\D','','g'),10) NOT IN (
               SELECT right(regexp_replace(phone,'\D','','g'),10)
                 FROM applications
                WHERE event_slug = p_event_slug
                  AND status IN ('advance_paid','fully_paid'));
    END IF;
    RETURN v_done;
  END IF;

  v_n := array_length(v_marketers,1);

  -- Current unconverted load (distinct phones) per active marketer; each
  -- target phone below is dealt to the least-loaded one at that moment.
  v_loads := array_fill(0, ARRAY[v_n]);
  FOR v_i IN 1..v_n LOOP
    SELECT count(DISTINCT right(regexp_replace(a.phone,'\D','','g'),10))
      INTO v_load
      FROM applications a
     WHERE a.event_slug = p_event_slug
       AND a.assigned_marketer_id = v_marketers[v_i]
       AND a.status NOT IN ('advance_paid','fully_paid','rejected');
    v_loads[v_i] := COALESCE(v_load, 0);
  END LOOP;

  -- Target phones: the removed marketer's people (removal mode), or people
  -- with no live assignment (add/orphan mode). Converted phones excluded.
  FOR v_rec IN
    SELECT phone10, min(seen) AS first_seen
    FROM (
      SELECT right(regexp_replace(phone,'\D','','g'),10) AS phone10, created_at AS seen
        FROM applications
       WHERE event_slug = p_event_slug
         AND status NOT IN ('advance_paid','fully_paid','rejected')
         AND CASE WHEN p_removed_marketer IS NOT NULL
                  THEN assigned_marketer_id = p_removed_marketer
                  ELSE assigned_marketer_id IS NULL
                       OR NOT (assigned_marketer_id = ANY(v_marketers))
             END
      UNION ALL
      SELECT right(regexp_replace(phone,'\D','','g'),10), submitted_at
        FROM doubt_submissions
       WHERE resolve_event_slug(event_title) = p_event_slug
         AND CASE WHEN p_removed_marketer IS NOT NULL
                  THEN assigned_marketer_id = p_removed_marketer
                  ELSE assigned_marketer_id IS NULL
                       OR NOT (assigned_marketer_id = ANY(v_marketers))
             END
    ) u
    WHERE phone10 NOT IN (
            SELECT right(regexp_replace(phone,'\D','','g'),10)
              FROM applications
             WHERE event_slug = p_event_slug
               AND status IN ('advance_paid','fully_paid'))
      AND (
            p_removed_marketer IS NOT NULL   -- removal: their people always re-home
            OR NOT v_is_open                 -- invite events: every orphan qualifies
            OR phone10 IN (                  -- open events: doubt-raisers only
                 SELECT right(regexp_replace(phone,'\D','','g'),10)
                   FROM doubt_submissions
                  WHERE resolve_event_slug(event_title) = p_event_slug)
          )
    GROUP BY phone10
    ORDER BY first_seen, phone10
  LOOP
    v_pick := 1;
    FOR v_i IN 2..v_n LOOP
      IF v_loads[v_i] < v_loads[v_pick] THEN v_pick := v_i; END IF;
    END LOOP;

    UPDATE applications
       SET assigned_marketer_id = v_marketers[v_pick]
     WHERE event_slug = p_event_slug
       AND status NOT IN ('advance_paid','fully_paid','rejected')
       AND right(regexp_replace(phone,'\D','','g'),10) = v_rec.phone10;
    UPDATE doubt_submissions
       SET assigned_marketer_id = v_marketers[v_pick]
     WHERE resolve_event_slug(event_title) = p_event_slug
       AND right(regexp_replace(phone,'\D','','g'),10) = v_rec.phone10;

    v_loads[v_pick] := v_loads[v_pick] + 1;
    v_done := v_done + 1;
  END LOOP;

  RETURN v_done;
END
$$;

-- Removal passes the departing marketer; add passes NULL (orphans only).
CREATE OR REPLACE FUNCTION public.event_marketers_changed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM redistribute_event_marketers(OLD.event_slug, OLD.marketer_id);
    RETURN OLD;
  ELSE
    PERFORM redistribute_event_marketers(NEW.event_slug, NULL);
    RETURN NEW;
  END IF;
END
$$;

-- Deactivation = removal from every event they were mapped to.
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
      PERFORM redistribute_event_marketers(v_event, NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;
