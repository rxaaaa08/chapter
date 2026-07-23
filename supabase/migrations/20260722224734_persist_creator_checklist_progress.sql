-- Persist the creator dashboard checklist's manual milestones on the creator
-- row. Timestamps make each completion monotonic: once set, the client-facing
-- RPC never clears or rewrites it.
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS checklist_joined_chat_at  timestamptz,
  ADD COLUMN IF NOT EXISTS checklist_opened_drive_at timestamptz,
  ADD COLUMN IF NOT EXISTS checklist_copied_link_at  timestamptz;

-- Creators must not receive broad UPDATE access to their affiliates row (which
-- also contains payout and account-control fields). This RPC exposes only the
-- three allow-listed checklist transitions and scopes the update to the active
-- creator resolved from the authenticated JWT.
CREATE OR REPLACE FUNCTION public.complete_creator_checklist_step(p_step text)
RETURNS TABLE (
  joined_chat  boolean,
  opened_drive boolean,
  copied_link  boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
BEGIN
  v_affiliate_id := public.current_affiliate_id();

  IF v_affiliate_id IS NULL THEN
    RAISE EXCEPTION 'An active creator account is required'
      USING ERRCODE = '42501';
  END IF;

  IF coalesce(p_step, '') NOT IN ('joined_chat', 'opened_drive', 'copied_link') THEN
    RAISE EXCEPTION 'Unknown creator checklist step'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.affiliates
     SET checklist_joined_chat_at = CASE
           WHEN p_step = 'joined_chat' THEN coalesce(checklist_joined_chat_at, now())
           ELSE checklist_joined_chat_at
         END,
         checklist_opened_drive_at = CASE
           WHEN p_step = 'opened_drive' THEN coalesce(checklist_opened_drive_at, now())
           ELSE checklist_opened_drive_at
         END,
         checklist_copied_link_at = CASE
           WHEN p_step = 'copied_link' THEN coalesce(checklist_copied_link_at, now())
           ELSE checklist_copied_link_at
         END
   WHERE id = v_affiliate_id;

  RETURN QUERY
  SELECT a.checklist_joined_chat_at IS NOT NULL,
         a.checklist_opened_drive_at IS NOT NULL,
         a.checklist_copied_link_at IS NOT NULL
    FROM public.affiliates a
   WHERE a.id = v_affiliate_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_creator_checklist_step(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_creator_checklist_step(text) TO authenticated;
