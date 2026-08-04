-- Open events now assign every incoming lead, exactly like invite events.
-- Ownership is universal; the fee is what varies (see the staggered-fees
-- migration). This replaces the doubt-only fallback introduced by
-- 20260706_open_event_marketer_assignment.sql.

-- Doubt rows already carry event_id, but the old assignment trigger ignored it
-- and resolved only the display title. Copied events can temporarily share a
-- title, which can send the doubt to an unmapped copy and leave it unowned.
-- Accept a database id as well as a slug/title, and prefer exact identity over
-- the legacy title fallback.
--
-- Both sides are trimmed. Titles are typed by hand and drift: production
-- already carries an event titled 'Chill Sunday Meetup ' with a trailing space,
-- and an untrimmed comparison resolves such a title to NULL. A NULL here makes
-- the assignment triggers bail silently and leave the lead unowned, which is
-- exactly the failure this migration exists to stop. An all-whitespace or empty
-- needle collapses to NULL so it can never match a blank slug or title.
CREATE OR REPLACE FUNCTION public.resolve_event_slug(p_title text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH needle AS (SELECT NULLIF(lower(btrim(p_title)), '') AS n)
  SELECT e.slug
    FROM events e, needle
   WHERE lower(e.id::text)    = needle.n
      OR lower(btrim(e.slug))  = needle.n
      OR lower(btrim(e.title)) = needle.n
   ORDER BY CASE
              WHEN lower(e.id::text)   = needle.n THEN 0
              WHEN lower(btrim(e.slug)) = needle.n THEN 1
              ELSE 2
            END,
            e.slug
   LIMIT 1
$$;

-- Prefer the doubt's stable event_id. event_title remains a fallback for old
-- rows created before event_id was populated.
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
  v_slug := COALESCE(
    resolve_event_slug(NULLIF(trim(NEW.event_id::text), '')),
    resolve_event_slug(NEW.event_title)
  );
  IF v_slug IS NULL THEN RETURN NEW; END IF;
  v_phone := right(regexp_replace(coalesce(NEW.phone,''), '\D', '', 'g'), 10);

  SELECT a.assigned_marketer_id INTO v_marketer
    FROM applications a
   WHERE right(regexp_replace(a.phone,'\D','','g'),10) = v_phone
     AND a.event_slug = v_slug
     AND a.assigned_marketer_id IS NOT NULL
   ORDER BY a.created_at
   LIMIT 1;

  IF v_marketer IS NULL THEN
    SELECT ds.assigned_marketer_id INTO v_marketer
      FROM doubt_submissions ds
     WHERE right(regexp_replace(ds.phone,'\D','','g'),10) = v_phone
       AND COALESCE(
             resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
             resolve_event_slug(ds.event_title)
           ) = v_slug
       AND ds.assigned_marketer_id IS NOT NULL
     LIMIT 1;
  END IF;

  IF v_marketer IS NULL THEN
    SELECT array_agg(cm.id ORDER BY cm.id) INTO v_marketers
      FROM event_marketers em
      JOIN call_marketers cm ON cm.id = em.marketer_id
     WHERE em.event_slug = v_slug AND cm.active = true;
    IF v_marketers IS NOT NULL AND array_length(v_marketers,1) > 0 THEN
      v_n := array_length(v_marketers,1);
      SELECT count(*) INTO v_count
        FROM doubt_submissions ds
       WHERE COALESCE(
               resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
               resolve_event_slug(ds.event_title)
             ) = v_slug
         AND ds.assigned_marketer_id IS NOT NULL;
      v_marketer := v_marketers[(v_count % v_n) + 1];
    END IF;
  END IF;

  NEW.assigned_marketer_id := v_marketer;

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

REVOKE EXECUTE ON FUNCTION public.assign_doubt_submission_marketer()
  FROM PUBLIC, anon, authenticated;

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

  -- Preserve an existing owner when this person already asked a doubt about
  -- the event, regardless of whether the event is invite-only or open.
  SELECT ds.assigned_marketer_id INTO v_marketer
    FROM doubt_submissions ds
   WHERE right(regexp_replace(ds.phone,'\D','','g'),10) = v_phone
     AND COALESCE(
           resolve_event_slug(NULLIF(trim(ds.event_id::text), '')),
           resolve_event_slug(ds.event_title)
         ) = NEW.event_slug
     AND ds.assigned_marketer_id IS NOT NULL
   LIMIT 1;

  -- Every new lead now receives an owner when the event has an active mapped
  -- marketer. pick_marketer_round_robin() safely returns NULL when it does not.
  IF v_marketer IS NULL THEN
    v_marketer := pick_marketer_round_robin(NEW.event_slug);
  END IF;

  NEW.assigned_marketer_id := v_marketer;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION public.assign_application_marketer()
  FROM PUBLIC, anon, authenticated;
