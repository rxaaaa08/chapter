-- Re-target flag: set by the retarget-check job when an invited user got the
-- AiSensy invite but never opened the bill page within 24h. Covers BOTH
-- AiSensy delivery failures and people who saw the message and ignored it,
-- so call marketers can chase them. Kept SEPARATE from status (mirrors the
-- cart_abandoned pattern) so payment lifecycle + invite-flow auth gates that
-- key off status IN ('invited','advance_paid','fully_paid') stay untouched.
--
-- invite_sent_at is the timestamp the AiSensy invite was actually fired —
-- approveApplication sets it on the row when the AiSensy call resolves.
-- Without this we couldn't compute the 24h window from aisensy_invite_sent
-- alone (it's just a boolean).
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS re_target boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz;

-- Backfill: existing invited rows get invite_sent_at = created_at so they're
-- eligible for re-target immediately. Imperfect (created_at is application
-- time, not approval time) but fine as a one-time bootstrap.
UPDATE public.applications
  SET invite_sent_at = created_at
  WHERE aisensy_invite_sent = true
    AND invite_sent_at IS NULL;
