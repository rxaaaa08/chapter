-- Bug fix from the manager-role E2E review: manager_add_marketer() could be
-- given a FOUNDER's email. It would refuse to demote the admin_users row
-- (ON CONFLICT DO NOTHING) — but it still created the call_marketers side-car
-- row, and an admin with a side-car row fails is_admin_only(), silently
-- breaking that admin's own panel view (they'd see only "their" leads).
-- Guard BEFORE any row is created. The Add Manager / Add Marketer admin UIs
-- get the same client-side check.

CREATE OR REPLACE FUNCTION public.manager_add_marketer(p_email text, p_name text, p_event_slug text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mgr_id    uuid := current_manager_id();
  mgr_name  text;
  v_email   text := lower(trim(p_email));
  v_name    text := trim(p_name);
  mk_id     uuid;
  mk_active boolean;
  ev_title  text;
BEGIN
  IF mgr_id IS NULL OR NOT is_event_manager(p_event_slug) THEN
    RAISE EXCEPTION 'forbidden: you do not manage this event';
  END IF;
  IF v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'invalid email address';
  END IF;
  IF length(v_name) < 1 OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'name must be 1-80 characters';
  END IF;
  -- An admin email must never gain a side-car row (it would break their
  -- admin view via is_admin_only()).
  IF EXISTS (SELECT 1 FROM admin_users WHERE email = v_email AND role = 'admin') THEN
    RAISE EXCEPTION 'this email belongs to a founder/admin and cannot be hired as a marketer';
  END IF;

  SELECT id, active INTO mk_id, mk_active FROM call_marketers WHERE email = v_email;
  IF mk_id IS NULL THEN
    INSERT INTO call_marketers (email, name) VALUES (v_email, v_name)
    RETURNING id INTO mk_id;
  ELSIF NOT mk_active THEN
    RAISE EXCEPTION 'this marketer was deactivated by an admin — ask an admin to reactivate them';
  END IF;

  INSERT INTO admin_users (email, role) VALUES (v_email, 'ops')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO event_marketers (event_slug, marketer_id) VALUES (p_event_slug, mk_id)
  ON CONFLICT DO NOTHING;

  SELECT name  INTO mgr_name FROM managers WHERE id = mgr_id;
  SELECT title INTO ev_title FROM events   WHERE slug = p_event_slug;

  PERFORM log_admin_action('manager_hire_marketer', 'call_marketers', mk_id::text,
    jsonb_build_object('email', v_email, 'name', v_name, 'event_slug', p_event_slug));
  PERFORM notify_admin_push(jsonb_build_object(
    'type', 'manager_brief',
    'record', jsonb_build_object(
      'title', '🧑‍💼 Marketer hired',
      'body',  coalesce(mgr_name, 'A manager') || ' added ' || v_name || ' to ' || coalesce(ev_title, p_event_slug)
    )));

  RETURN jsonb_build_object('marketer_id', mk_id, 'email', v_email, 'name', v_name);
END;
$$;
