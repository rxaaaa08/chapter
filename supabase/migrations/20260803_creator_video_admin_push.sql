-- Admin push when a creator submits a video.
--
-- A creator's only write path is submit_creator_video(), which INSERTs one row
-- into creator_submissions. This trigger fires on that INSERT and posts a
-- 'new_creator_video' push via notify_admin_push() (same pg_net + shared-secret
-- wrapper as every other admin alert). The row carries only affiliate_id, so we
-- look up the creator's name; the edge function resolves event_slug → title.
--
-- Routing: 'new_creator_video' is deliberately NOT in the edge function's
-- STAFF_TYPES set, so this reaches founders only — matching the founders-only
-- gate on the creator-video review queue itself.

CREATE OR REPLACE FUNCTION public.trg_admin_push_new_creator_video()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE v_name text;
BEGIN
  SELECT name INTO v_name FROM public.affiliates WHERE id = NEW.affiliate_id;
  PERFORM notify_admin_push(jsonb_build_object(
    'type', 'new_creator_video',
    'record', jsonb_build_object(
      'creator_name', COALESCE(NULLIF(btrim(v_name), ''), 'A creator'),
      'event_slug',   NEW.event_slug,
      'event_date',   NEW.event_date
    )
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_push_new_creator_video ON public.creator_submissions;
CREATE TRIGGER trg_admin_push_new_creator_video
AFTER INSERT ON public.creator_submissions
FOR EACH ROW EXECUTE FUNCTION public.trg_admin_push_new_creator_video();
