-- Manager role — Phase 3: team controls.
-- 1) Managers can add/remove marketers on THEIR events (the existing
--    event_marketers triggers auto-redistribute leads — they're SECURITY
--    DEFINER, so this works even though managers can't touch applications
--    outside their scope).
-- 2) manager_add_marketer(): fully autonomous hiring (founder-confirmed) —
--    creates the call_marketers row + ops login + event assignment in one
--    atomic call, audit-logs it, and pushes a notification to admins via the
--    existing notify_admin_push() → send-admin-push pipeline (the
--    'manager_brief' type passes title/body through, so no edge deploy).

-- ── RLS: manager writes on event_marketers (own events only) ──────────────

DROP POLICY IF EXISTS event_marketers_manager_insert ON public.event_marketers;
CREATE POLICY event_marketers_manager_insert ON public.event_marketers
  FOR INSERT TO authenticated
  WITH CHECK (current_manager_id() IS NOT NULL AND is_event_manager(event_slug));

DROP POLICY IF EXISTS event_marketers_manager_delete ON public.event_marketers;
CREATE POLICY event_marketers_manager_delete ON public.event_marketers
  FOR DELETE TO authenticated
  USING (current_manager_id() IS NOT NULL AND is_event_manager(event_slug));

-- ── Hiring RPC ────────────────────────────────────────────────────────────

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
  -- Managers can only hire into events they manage.
  IF mgr_id IS NULL OR NOT is_event_manager(p_event_slug) THEN
    RAISE EXCEPTION 'forbidden: you do not manage this event';
  END IF;
  IF v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'invalid email address';
  END IF;
  IF length(v_name) < 1 OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'name must be 1-80 characters';
  END IF;

  SELECT id, active INTO mk_id, mk_active FROM call_marketers WHERE email = v_email;
  IF mk_id IS NULL THEN
    -- New marketer at the ₹50 table default; per-event rates still apply.
    INSERT INTO call_marketers (email, name) VALUES (v_email, v_name)
    RETURNING id INTO mk_id;
  ELSIF NOT mk_active THEN
    -- Deactivation is an admin decision — a manager can't silently undo it.
    RAISE EXCEPTION 'this marketer was deactivated by an admin — ask an admin to reactivate them';
  END IF;

  -- Login gate. DO NOTHING on conflict so an existing admin email is never
  -- demoted to ops.
  INSERT INTO admin_users (email, role) VALUES (v_email, 'ops')
  ON CONFLICT (email) DO NOTHING;

  -- Assign to the manager's event; the AFTER INSERT trigger redistributes.
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

REVOKE ALL ON FUNCTION public.manager_add_marketer(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manager_add_marketer(text, text, text) TO authenticated, service_role;
