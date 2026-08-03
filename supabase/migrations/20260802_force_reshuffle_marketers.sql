-- ── Manual "Reshuffle leads" button (2026-08-02 owner request) ────────────────
--
-- A deliberate, admin-triggered FULL re-deal of an event's leads round-robin
-- across its currently-active marketers. This is the opposite of the automatic
-- targeted redistribution (20260718_targeted_marketer_redistribution.sql):
--
--   * The auto triggers move only orphaned / removed-marketer leads, precisely
--     so a lead a marketer is mid-conversation with is NOT yanked away.
--   * THIS function ignores who currently holds what and re-splits everyone
--     evenly. It only ever runs when an admin presses the Reshuffle button —
--     there is no trigger on it. Mid-conversation continuity is knowingly
--     traded for an even split; that is the point of the button.
--
-- Rules (owner decisions 2026-08-02):
--   * Scope = "everything except paid": every lead whose status is NOT
--     advance_paid / fully_paid is eligible to move — including rejected /
--     waitlist / cart-abandoned. Paid leads never move (commission attribution
--     is sacred), and a person with ANY paid ticket on the event is kept whole
--     with their converting marketer (none of their rows move).
--   * Even fresh re-deal: eligible people are dealt strictly round-robin
--     (person i → marketers[i % n]) ordered by first-seen, so every active
--     marketer ends with an equal share regardless of prior load.
--   * Whole event: all dates at once (round-robin is event-level, as elsewhere).
--   * Person-level: grouped by last-10-digit phone across applications +
--     doubt_submissions, so all of a person's rows land on one marketer.
--   * Open events keep the standing rule "never assign cold leads" — only
--     phones that raised a doubt are eligible (invite events: everyone).
--
-- Returns the number of PEOPLE re-dealt.

CREATE OR REPLACE FUNCTION public.force_reshuffle_event_marketers(p_event_slug text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_marketers uuid[];
  v_n         integer;
  v_rec       record;
  v_idx       integer := 0;
  v_done      integer := 0;
  v_is_open   boolean := COALESCE(is_open_event(p_event_slug), false);
BEGIN
  -- Founders only. This moves live leads between people's queues, so it is
  -- gated to strict admins (= admin_users.role='admin' = the UI's adminRole
  -- 'admin' that shows the button), not ops/marketers.
  IF NOT is_admin_strict() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT array_agg(cm.id ORDER BY cm.id) INTO v_marketers
    FROM event_marketers em JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = p_event_slug AND cm.active = true;

  IF v_marketers IS NULL OR array_length(v_marketers,1) = 0 THEN
    RETURN 0;  -- nobody to deal to; leave assignments untouched
  END IF;
  v_n := array_length(v_marketers,1);

  -- Doubts of converted phones always mirror the converting application's
  -- marketer (same parity kept by the auto-redistribute function).
  UPDATE doubt_submissions ds
     SET assigned_marketer_id = a.assigned_marketer_id
    FROM applications a
   WHERE a.event_slug = p_event_slug
     AND a.status IN ('advance_paid','fully_paid')
     AND right(regexp_replace(a.phone,'\D','','g'),10) = right(regexp_replace(ds.phone,'\D','','g'),10)
     AND resolve_event_slug(ds.event_title) = p_event_slug;

  -- Eligible people: distinct phones across applications (any non-paid status)
  -- and doubt_submissions, EXCLUDING anyone with a paid ticket on the event.
  -- Ordered by first-seen so the round-robin split is deterministic and even.
  FOR v_rec IN
    SELECT phone10, min(seen) AS first_seen
    FROM (
      SELECT right(regexp_replace(phone,'\D','','g'),10) AS phone10, created_at AS seen
        FROM applications
       WHERE event_slug = p_event_slug
         AND status NOT IN ('advance_paid','fully_paid')
      UNION ALL
      SELECT right(regexp_replace(phone,'\D','','g'),10), submitted_at
        FROM doubt_submissions
       WHERE resolve_event_slug(event_title) = p_event_slug
    ) u
    WHERE phone10 NOT IN (
            SELECT right(regexp_replace(phone,'\D','','g'),10)
              FROM applications
             WHERE event_slug = p_event_slug
               AND status IN ('advance_paid','fully_paid'))
      AND (
            NOT v_is_open                    -- invite events: everyone eligible
            OR phone10 IN (                  -- open events: doubt-raisers only
                 SELECT right(regexp_replace(phone,'\D','','g'),10)
                   FROM doubt_submissions
                  WHERE resolve_event_slug(event_title) = p_event_slug)
          )
    GROUP BY phone10
    ORDER BY first_seen, phone10
  LOOP
    UPDATE applications
       SET assigned_marketer_id = v_marketers[(v_idx % v_n) + 1]
     WHERE event_slug = p_event_slug
       AND status NOT IN ('advance_paid','fully_paid')
       AND right(regexp_replace(phone,'\D','','g'),10) = v_rec.phone10;
    UPDATE doubt_submissions
       SET assigned_marketer_id = v_marketers[(v_idx % v_n) + 1]
     WHERE resolve_event_slug(event_title) = p_event_slug
       AND right(regexp_replace(phone,'\D','','g'),10) = v_rec.phone10;

    v_idx  := v_idx + 1;
    v_done := v_done + 1;
  END LOOP;

  RETURN v_done;
END
$$;

REVOKE ALL ON FUNCTION public.force_reshuffle_event_marketers(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.force_reshuffle_event_marketers(text) TO authenticated, service_role;
