-- Manager role — Phase 4: dates & group chats.
-- Managers add NEW event dates and edit group-chat links / availability on
-- their events — deliberately via SECURITY DEFINER RPCs, not RLS writes on
-- event_dates, because the safety rules are column- and row-shaped:
--   * additive only — no delete, no start_date rename (renames strand
--     existing bookings; known landmine in the admin editor),
--   * a new date MUST get booking_steps seeded or bookings on it render a
--     broken timeline,
--   * updates may touch ONLY whatsapp_group_url and status.
--
-- Seeding: copy the sibling event_dates row with the latest start_date and
-- SHIFT every dated step by (new_date - sibling_date), preserving the
-- event's payment rhythm (e.g. "balance due 15 days before") instead of
-- copying stale absolute dates. Steps with no date (labels, counters) are
-- copied as-is. If the event has no sibling date rows, fall back to the
-- event-level booking_steps verbatim (the runtime already treats those as
-- the fallback timeline; /check-event flags bad dates before launch).

CREATE OR REPLACE FUNCTION public.manager_add_event_date(
  p_event_slug text,
  p_start_date date,
  p_label text DEFAULT NULL,
  p_whatsapp_group_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_id uuid;
  v_sibling  event_dates%ROWTYPE;
  v_steps    jsonb;
  v_delta    integer;
  v_new_id   uuid;
  elem       jsonb;
  out_steps  jsonb := '[]'::jsonb;
BEGIN
  IF current_manager_id() IS NULL OR NOT is_event_manager(p_event_slug) THEN
    RAISE EXCEPTION 'forbidden: you do not manage this event';
  END IF;
  IF p_start_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN
    RAISE EXCEPTION 'date is in the past';
  END IF;

  SELECT id INTO v_event_id FROM events WHERE slug = p_event_slug;
  IF v_event_id IS NULL THEN RAISE EXCEPTION 'unknown event'; END IF;
  IF EXISTS (SELECT 1 FROM event_dates WHERE event_id = v_event_id AND start_date = p_start_date) THEN
    RAISE EXCEPTION 'that date already exists on this event';
  END IF;

  SELECT * INTO v_sibling FROM event_dates
  WHERE event_id = v_event_id ORDER BY start_date DESC LIMIT 1;

  IF v_sibling.id IS NOT NULL AND v_sibling.booking_steps IS NOT NULL THEN
    v_delta := p_start_date - v_sibling.start_date;
    FOR elem IN SELECT * FROM jsonb_array_elements(v_sibling.booking_steps) LOOP
      IF COALESCE(elem->>'date','') <> '' AND (elem->>'date') ~ '^\d{4}-\d{2}-\d{2}$' THEN
        elem := jsonb_set(elem, '{date}', to_jsonb(to_char((elem->>'date')::date + v_delta, 'YYYY-MM-DD')));
      END IF;
      out_steps := out_steps || jsonb_build_array(elem);
    END LOOP;
    v_steps := out_steps;
  ELSE
    SELECT booking_steps INTO v_steps FROM events WHERE id = v_event_id;
  END IF;

  INSERT INTO event_dates (event_id, start_date, label, whatsapp_group_url, booking_steps,
                           duration_days, status)
  VALUES (v_event_id, p_start_date, NULLIF(trim(COALESCE(p_label,'')),''),
          NULLIF(trim(COALESCE(p_whatsapp_group_url,'')),''), v_steps,
          COALESCE(v_sibling.duration_days, 1), 'available')
  RETURNING id INTO v_new_id;

  PERFORM log_admin_action('manager_add_event_date', 'event_dates', v_new_id::text,
    jsonb_build_object('event_slug', p_event_slug, 'start_date', p_start_date,
                       'seeded_from', v_sibling.start_date));

  RETURN jsonb_build_object('id', v_new_id, 'start_date', p_start_date,
                            'steps_seeded', v_steps IS NOT NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.manager_add_event_date(text, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manager_add_event_date(text, date, text, text) TO authenticated, service_role;

-- Update ONLY group link + availability status on a date of a managed event.
CREATE OR REPLACE FUNCTION public.manager_update_event_date(
  p_date_id uuid,
  p_whatsapp_group_url text,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slug text;
BEGIN
  SELECT e.slug INTO v_slug
  FROM event_dates d JOIN events e ON e.id = d.event_id
  WHERE d.id = p_date_id;
  IF v_slug IS NULL THEN RAISE EXCEPTION 'unknown date'; END IF;
  IF current_manager_id() IS NULL OR NOT is_event_manager(v_slug) THEN
    RAISE EXCEPTION 'forbidden: you do not manage this event';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('available','selling_out','sold_out') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  UPDATE event_dates SET
    whatsapp_group_url = NULLIF(trim(COALESCE(p_whatsapp_group_url,'')),''),
    status             = COALESCE(p_status, status)
  WHERE id = p_date_id;

  PERFORM log_admin_action('manager_update_event_date', 'event_dates', p_date_id::text,
    jsonb_build_object('event_slug', v_slug, 'status', p_status,
                       'has_group_url', NULLIF(trim(COALESCE(p_whatsapp_group_url,'')),'') IS NOT NULL));

  RETURN jsonb_build_object('id', p_date_id, 'status', COALESCE(p_status,'unchanged'));
END;
$$;

REVOKE ALL ON FUNCTION public.manager_update_event_date(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manager_update_event_date(uuid, text, text) TO authenticated, service_role;
