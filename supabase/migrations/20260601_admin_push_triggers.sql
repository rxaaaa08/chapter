-- Admin push notifications: trigger wiring for all 5 notification types.
--
-- Types:
--   new_application       → applications INSERT
--   advance_paid          → applications UPDATE (status → advance_paid)
--   fully_paid            → applications UPDATE (status → fully_paid)
--   new_invite_doubt      → plan_doubts INSERT (invite-flow doubt form)
--   new_booking_doubt     → doubt_submissions INSERT (booking-flow doubt form)
--
-- The notify_admin_push() wrapper posts to the send-admin-push edge function
-- via pg_net. SECURITY DEFINER + explicit search_path is required so net.http_post
-- resolves correctly when invoked from RLS-restricted contexts.

CREATE OR REPLACE FUNCTION public.notify_admin_push(payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE req_id bigint;
BEGIN
  SELECT net.http_post(
    url     := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/send-admin-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := payload
  ) INTO req_id;
  RETURN req_id;
END;
$$;

-- Drop dead live-chat trigger (consumer PWA was removed; doubt_messages is unused).
DROP TRIGGER IF EXISTS trg_admin_push_new_doubt ON public.doubt_messages;
DROP FUNCTION IF EXISTS public.trg_admin_push_new_doubt() CASCADE;

-- applications: new application
CREATE OR REPLACE FUNCTION public.trg_admin_push_new_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM notify_admin_push(jsonb_build_object(
    'type', 'new_application',
    'record', jsonb_build_object(
      'name', NEW.name, 'event_slug', NEW.event_slug,
      'phone', NEW.phone, 'selected_date', NEW.selected_date
    )
  ));
  RETURN NEW;
END;
$$;

-- applications: status advance_paid
CREATE OR REPLACE FUNCTION public.trg_admin_push_advance_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'advance_paid' AND (OLD.status IS DISTINCT FROM 'advance_paid') THEN
    PERFORM notify_admin_push(jsonb_build_object(
      'type', 'advance_paid',
      'record', jsonb_build_object(
        'name', NEW.name, 'event_slug', NEW.event_slug,
        'phone', NEW.phone, 'selected_date', NEW.selected_date
      )
    ));
  END IF;
  RETURN NEW;
END;
$$;

-- applications: status fully_paid
CREATE OR REPLACE FUNCTION public.trg_admin_push_fully_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'fully_paid' AND (OLD.status IS DISTINCT FROM 'fully_paid') THEN
    PERFORM notify_admin_push(jsonb_build_object(
      'type', 'fully_paid',
      'record', jsonb_build_object(
        'name', NEW.name, 'event_slug', NEW.event_slug,
        'phone', NEW.phone, 'selected_date', NEW.selected_date
      )
    ));
  END IF;
  RETURN NEW;
END;
$$;

-- doubt_submissions: booking-flow doubt form
CREATE OR REPLACE FUNCTION public.trg_admin_push_doubt_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM notify_admin_push(jsonb_build_object(
    'type', 'new_booking_doubt',
    'record', jsonb_build_object(
      'name', NEW.name, 'phone', NEW.phone,
      'doubt', NEW.doubt, 'event_title', NEW.event_title
    )
  ));
  RETURN NEW;
END;
$$;

-- plan_doubts: invite-flow doubt form (higher priority — invitee already engaged)
CREATE OR REPLACE FUNCTION public.trg_admin_push_plan_doubt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM notify_admin_push(jsonb_build_object(
    'type', 'new_invite_doubt',
    'record', jsonb_build_object(
      'phone', NEW.phone, 'event_slug', NEW.event_slug,
      'message', NEW.message
    )
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_push_plan_doubt ON public.plan_doubts;
CREATE TRIGGER trg_admin_push_plan_doubt
AFTER INSERT ON public.plan_doubts
FOR EACH ROW EXECUTE FUNCTION public.trg_admin_push_plan_doubt();
