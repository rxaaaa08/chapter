-- Push routing groundwork (founder decision, 2026-07-19 clarity round):
-- staff should receive pushes at THEIR level — a manager gets activity on
-- their events, a marketer gets activity on their own leads — while founders
-- keep receiving everything (briefs, scorecards, hires, all events). Today
-- send-admin-push broadcasts every notification to every subscribed device,
-- and the Settings tab lets any ops user subscribe.
--
-- This migration is the DB half:
--   1. admin_push_subscriptions.email — who owns the device. NULL = unknown
--      owner, which the edge function SKIPS (founder correction 2026-07-19:
--      4 of the 5 legacy devices were MARKETER phones, so NULL must never
--      default to founder-level). Identifiable legacy rows were stamped by
--      label→roster match (Krutesh→founder, Thinukshan, Arun); the two
--      anonymous ones (Desktop, Android Device) stay NULL and go silent
--      until their owners re-subscribe from Settings. New subscriptions
--      stamp the login email client-side.
--   2. The push trigger payloads gain assigned_marketer_id (and a resolved
--      event_slug for booking doubts) so the edge function can route.
-- The routing itself lives in supabase/functions/send-admin-push (same
-- commit) — OWNER DEPLOYS it (--no-verify-jwt). Until deployed, behaviour
-- is unchanged: the live function ignores the new fields and broadcasts.

ALTER TABLE public.admin_push_subscriptions ADD COLUMN IF NOT EXISTS email text;

-- Faithful copies of the live trigger functions + the routing fields.

CREATE OR REPLACE FUNCTION public.trg_admin_push_new_application()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  -- Open events (payu-hosted) create a 'pending' application the moment a lead
  -- enters their details (before paying), so this "new application" push would
  -- fire on every pre-payment details entry — noise. Skip it for open events;
  -- the advance/fully-paid push triggers still fire when they actually pay.
  -- Invite events keep firing as before (their booking_url isn't 'payu-hosted').
  if (select e.booking_url from events e
        where e.slug = NEW.event_slug or e.invite_slug = NEW.event_slug
        limit 1) = 'payu-hosted' then
    return NEW;
  end if;

  perform notify_admin_push(jsonb_build_object(
    'type', 'new_application',
    'record', jsonb_build_object(
      'name', NEW.name, 'event_slug', NEW.event_slug,
      'phone', NEW.phone, 'selected_date', NEW.selected_date,
      'assigned_marketer_id', NEW.assigned_marketer_id
    )
  ));
  return NEW;
end;
$$;

CREATE OR REPLACE FUNCTION public.trg_admin_push_advance_paid()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'advance_paid' AND (OLD.status IS DISTINCT FROM 'advance_paid') THEN
    PERFORM notify_admin_push(jsonb_build_object(
      'type', 'advance_paid',
      'record', jsonb_build_object(
        'name', NEW.name, 'event_slug', NEW.event_slug,
        'phone', NEW.phone, 'selected_date', NEW.selected_date,
        'assigned_marketer_id', NEW.assigned_marketer_id
      )
    ));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_admin_push_fully_paid()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'fully_paid' AND (OLD.status IS DISTINCT FROM 'fully_paid') THEN
    PERFORM notify_admin_push(jsonb_build_object(
      'type', 'fully_paid',
      'record', jsonb_build_object(
        'name', NEW.name, 'event_slug', NEW.event_slug,
        'phone', NEW.phone, 'selected_date', NEW.selected_date,
        'assigned_marketer_id', NEW.assigned_marketer_id
      )
    ));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_admin_push_doubt_submission()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM notify_admin_push(jsonb_build_object(
    'type', 'new_booking_doubt',
    'record', jsonb_build_object(
      'name', NEW.name, 'phone', NEW.phone,
      'doubt', NEW.doubt, 'event_title', NEW.event_title,
      'event_slug', resolve_event_slug(NEW.event_title),
      'assigned_marketer_id', NEW.assigned_marketer_id
    )
  ));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_admin_push_plan_doubt()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM notify_admin_push(jsonb_build_object(
    'type', 'new_invite_doubt',
    'record', jsonb_build_object(
      'phone', NEW.phone, 'event_slug', NEW.event_slug,
      'message', NEW.message,
      -- Plan doubts ride with the person's application; route to its owner.
      'assigned_marketer_id', (
        SELECT a.assigned_marketer_id FROM applications a
        WHERE a.event_slug = NEW.event_slug
          AND a.phone = right(regexp_replace(COALESCE(NEW.phone,''),'\D','','g'),10)
        LIMIT 1
      )
    )
  ));
  RETURN NEW;
END;
$$;
