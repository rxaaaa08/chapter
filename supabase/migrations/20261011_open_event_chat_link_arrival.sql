-- Open events: say HOW a verification session was earned.
--
-- Until now a row in open_event_otp_sessions could only become verified one
-- way: the guest typed the six-digit code we sent to their WhatsApp or email.
--
-- From 2026-10-11 there is a second way. A guest who taps the button in a
-- message we sent them inside their own WhatsApp chat lands on the site in
-- WhatsApp's own browser, and a code sent to that same chat is the one place a
-- code hurts: they have to close the site to read it. The link they tapped
-- already carries that message's private tap code (whatsapp_sends.click_token),
-- which only that one WhatsApp number ever received, so open-event-otp accepts
-- it in place of a typed code and writes the session already verified. The
-- rules live in that function, beside resolveChatLink().
--
-- These two columns are the record of it. Nothing reads them to make a
-- decision: create-payu-order still looks only at verified_at / expires_at /
-- event / phone / email, exactly as before. They exist so that "who skipped the
-- code, and on what proof" can always be answered from the data.
--
--   verified_via  NULL         = a typed code (every row before this, and every
--                                code since: verify_open_event_otp is untouched)
--                 'chat_link'  = the tap code of a message we sent them
--   via_send_id   the whatsapp_sends row whose tap code was presented
--
-- No foreign key on via_send_id on purpose: a send row being tidied away later
-- must never be able to block or cascade into a verification record.
--
-- The table keeps deny-all RLS with no policies, so neither column is reachable
-- from a browser session.

ALTER TABLE public.open_event_otp_sessions
  ADD COLUMN IF NOT EXISTS verified_via text,
  ADD COLUMN IF NOT EXISTS via_send_id  bigint;

COMMENT ON COLUMN public.open_event_otp_sessions.verified_via IS
  'How the session was verified. NULL = a typed six-digit code. ''chat_link'' = the tap code of a WhatsApp message we sent to this number (open-event-otp, action chat_verify).';
COMMENT ON COLUMN public.open_event_otp_sessions.via_send_id IS
  'whatsapp_sends.id of the message whose tap code was presented, when verified_via = ''chat_link''. Deliberately not a foreign key.';
