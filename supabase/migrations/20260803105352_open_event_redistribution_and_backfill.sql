-- Open events now use the same ownership rule as invite events: every lead is
-- assigned. Remove the old doubt-only carve-outs from both automatic targeted
-- redistribution and the founder's manual full reshuffle.

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
BEGIN
  SELECT array_agg(cm.id ORDER BY cm.id) INTO v_marketers
    FROM event_marketers em
    JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = p_event_slug AND cm.active = true;

  -- Doubts of converted phones always mirror the converting application's
  -- marketer, and stable event_id wins over a potentially duplicated title.
  UPDATE doubt_submissions ds
     SET assigned_marketer_id = a.assigned_marketer_id
    FROM applications a
   WHERE a.event_slug = p_event_slug
     AND a.status IN ('advance_paid','fully_paid')
     AND right(regexp_replace(a.phone,'\D','','g'),10)
         = right(regexp_replace(ds.phone,'\D','','g'),10)
     AND COALESCE(
           resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
           resolve_event_slug(ds.event_title)
         ) = p_event_slug;

  IF v_marketers IS NULL OR array_length(v_marketers,1) = 0 THEN
    -- No active marketers remain. On a removal, orphan only that person's
    -- unconverted leads so a future marketer can adopt them.
    IF p_removed_marketer IS NOT NULL THEN
      UPDATE applications
         SET assigned_marketer_id = NULL
       WHERE event_slug = p_event_slug
         AND assigned_marketer_id = p_removed_marketer
         AND status NOT IN ('advance_paid','fully_paid','rejected');
      GET DIAGNOSTICS v_done = ROW_COUNT;

      UPDATE doubt_submissions ds
         SET assigned_marketer_id = NULL
       WHERE COALESCE(
               resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
               resolve_event_slug(ds.event_title)
             ) = p_event_slug
         AND ds.assigned_marketer_id = p_removed_marketer
         AND right(regexp_replace(ds.phone,'\D','','g'),10) NOT IN (
               SELECT right(regexp_replace(phone,'\D','','g'),10)
                 FROM applications
                WHERE event_slug = p_event_slug
                  AND status IN ('advance_paid','fully_paid'));
    END IF;
    RETURN v_done;
  END IF;

  v_n := array_length(v_marketers,1);

  -- Current unconverted load per active marketer. Each orphan below goes to
  -- the least-loaded marketer at that moment.
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

  -- Removed-marketer mode moves that person's leads. Add/orphan mode adopts
  -- every person without a live owner. Paid phones remain pinned forever.
  FOR v_rec IN
    SELECT phone10, min(seen) AS first_seen
      FROM (
        SELECT right(regexp_replace(phone,'\D','','g'),10) AS phone10,
               created_at AS seen
          FROM applications
         WHERE event_slug = p_event_slug
           AND status NOT IN ('advance_paid','fully_paid','rejected')
           AND CASE WHEN p_removed_marketer IS NOT NULL
                    THEN assigned_marketer_id = p_removed_marketer
                    ELSE assigned_marketer_id IS NULL
                         OR NOT (assigned_marketer_id = ANY(v_marketers))
               END
        UNION ALL
        SELECT right(regexp_replace(ds.phone,'\D','','g'),10), ds.submitted_at
          FROM doubt_submissions ds
         WHERE COALESCE(
                 resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
                 resolve_event_slug(ds.event_title)
               ) = p_event_slug
           AND CASE WHEN p_removed_marketer IS NOT NULL
                    THEN ds.assigned_marketer_id = p_removed_marketer
                    ELSE ds.assigned_marketer_id IS NULL
                         OR NOT (ds.assigned_marketer_id = ANY(v_marketers))
               END
      ) u
     WHERE phone10 NOT IN (
             SELECT right(regexp_replace(phone,'\D','','g'),10)
               FROM applications
              WHERE event_slug = p_event_slug
                AND status IN ('advance_paid','fully_paid'))
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

    UPDATE doubt_submissions ds
       SET assigned_marketer_id = v_marketers[v_pick]
     WHERE COALESCE(
             resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
             resolve_event_slug(ds.event_title)
           ) = p_event_slug
       AND right(regexp_replace(ds.phone,'\D','','g'),10) = v_rec.phone10;

    v_loads[v_pick] := v_loads[v_pick] + 1;
    v_done := v_done + 1;
  END LOOP;

  RETURN v_done;
END
$$;

REVOKE EXECUTE ON FUNCTION public.redistribute_event_marketers(text, uuid)
  FROM PUBLIC, anon, authenticated;

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
BEGIN
  IF NOT is_admin_strict() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT array_agg(cm.id ORDER BY cm.id) INTO v_marketers
    FROM event_marketers em
    JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = p_event_slug AND cm.active = true;

  IF v_marketers IS NULL OR array_length(v_marketers,1) = 0 THEN
    RETURN 0;
  END IF;
  v_n := array_length(v_marketers,1);

  UPDATE doubt_submissions ds
     SET assigned_marketer_id = a.assigned_marketer_id
    FROM applications a
   WHERE a.event_slug = p_event_slug
     AND a.status IN ('advance_paid','fully_paid')
     AND right(regexp_replace(a.phone,'\D','','g'),10)
         = right(regexp_replace(ds.phone,'\D','','g'),10)
     AND COALESCE(
           resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
           resolve_event_slug(ds.event_title)
         ) = p_event_slug;

  -- Full re-deal of every unpaid person, including quiet open-event leads.
  -- Anyone with a paid ticket is excluded and keeps their existing owner.
  FOR v_rec IN
    SELECT phone10, min(seen) AS first_seen
      FROM (
        SELECT right(regexp_replace(phone,'\D','','g'),10) AS phone10,
               created_at AS seen
          FROM applications
         WHERE event_slug = p_event_slug
           AND status NOT IN ('advance_paid','fully_paid')
        UNION ALL
        SELECT right(regexp_replace(ds.phone,'\D','','g'),10), ds.submitted_at
          FROM doubt_submissions ds
         WHERE COALESCE(
                 resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
                 resolve_event_slug(ds.event_title)
               ) = p_event_slug
      ) u
     WHERE phone10 NOT IN (
             SELECT right(regexp_replace(phone,'\D','','g'),10)
               FROM applications
              WHERE event_slug = p_event_slug
                AND status IN ('advance_paid','fully_paid'))
     GROUP BY phone10
     ORDER BY first_seen, phone10
  LOOP
    UPDATE applications
       SET assigned_marketer_id = v_marketers[(v_idx % v_n) + 1]
     WHERE event_slug = p_event_slug
       AND status NOT IN ('advance_paid','fully_paid')
       AND right(regexp_replace(phone,'\D','','g'),10) = v_rec.phone10;

    UPDATE doubt_submissions ds
       SET assigned_marketer_id = v_marketers[(v_idx % v_n) + 1]
     WHERE COALESCE(
             resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
             resolve_event_slug(ds.event_title)
           ) = p_event_slug
       AND right(regexp_replace(ds.phone,'\D','','g'),10) = v_rec.phone10;

    v_idx  := v_idx + 1;
    v_done := v_done + 1;
  END LOOP;

  RETURN v_done;
END
$$;

REVOKE ALL ON FUNCTION public.force_reshuffle_event_marketers(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.force_reshuffle_event_marketers(text)
  TO authenticated, service_role;

-- Backfill the existing Kovalam leads. These updates only assign ownership;
-- they do not change status, so the commission trigger cannot create a sale.
-- Unpaid and paid rows are separate to make the no-retroactive-fee decision
-- explicit and reviewable in migration output.
WITH mk AS (
  SELECT cm.id,
         row_number() OVER (ORDER BY cm.id) - 1 AS idx,
         count(*) OVER () AS n
    FROM event_marketers em
    JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = 'sunrise-at-kovalam' AND cm.active
),
tgt AS (
  SELECT a.id,
         row_number() OVER (ORDER BY a.created_at, a.id) - 1 AS i
    FROM applications a
   WHERE a.event_slug = 'sunrise-at-kovalam'
     AND a.status NOT IN ('advance_paid','fully_paid')
     AND a.assigned_marketer_id IS NULL
)
UPDATE applications a
   SET assigned_marketer_id = mk.id
  FROM tgt, mk
 WHERE a.id = tgt.id AND mk.idx = tgt.i % mk.n
RETURNING a.id, a.name, a.status, a.assigned_marketer_id;

WITH mk AS (
  SELECT cm.id,
         row_number() OVER (ORDER BY cm.id) - 1 AS idx,
         count(*) OVER () AS n
    FROM event_marketers em
    JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = 'sunrise-at-kovalam' AND cm.active
),
tgt AS (
  SELECT a.id,
         row_number() OVER (ORDER BY a.created_at, a.id) - 1 AS i
    FROM applications a
   WHERE a.event_slug = 'sunrise-at-kovalam'
     AND a.status IN ('advance_paid','fully_paid')
     AND a.assigned_marketer_id IS NULL
)
UPDATE applications a
   SET assigned_marketer_id = mk.id
  FROM tgt, mk
 WHERE a.id = tgt.id AND mk.idx = tgt.i % mk.n
RETURNING a.id, a.name, a.status, a.assigned_marketer_id;

-- Match existing doubts to their application's owner, then deal any standalone
-- unowned doubts round-robin. Still no commission rows are created.
UPDATE doubt_submissions ds
   SET assigned_marketer_id = a.assigned_marketer_id
  FROM applications a
 WHERE a.event_slug = 'sunrise-at-kovalam'
   AND a.assigned_marketer_id IS NOT NULL
   AND COALESCE(
         resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
         resolve_event_slug(ds.event_title)
       ) = a.event_slug
   AND right(regexp_replace(ds.phone,'\D','','g'),10)
       = right(regexp_replace(a.phone,'\D','','g'),10)
   AND ds.assigned_marketer_id IS DISTINCT FROM a.assigned_marketer_id
RETURNING ds.id, ds.assigned_marketer_id;

WITH mk AS (
  SELECT cm.id,
         row_number() OVER (ORDER BY cm.id) - 1 AS idx,
         count(*) OVER () AS n
    FROM event_marketers em
    JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = 'sunrise-at-kovalam' AND cm.active
),
tgt AS (
  SELECT ds.id,
         row_number() OVER (ORDER BY ds.submitted_at, ds.id) - 1 AS i
    FROM doubt_submissions ds
   WHERE COALESCE(
           resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
           resolve_event_slug(ds.event_title)
         ) = 'sunrise-at-kovalam'
     AND ds.assigned_marketer_id IS NULL
)
UPDATE doubt_submissions ds
   SET assigned_marketer_id = mk.id
  FROM tgt, mk
 WHERE ds.id = tgt.id AND mk.idx = tgt.i % mk.n
RETURNING ds.id, ds.assigned_marketer_id;
