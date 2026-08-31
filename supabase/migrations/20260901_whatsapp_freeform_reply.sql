-- Free-form staff replies to inbound WhatsApp messages.
--
-- Stored in whatsapp_sends alongside template sends so a conversation reads in
-- order from one place: template_name stays NULL for a free-form reply, and
-- body_text carries what was actually typed. Delivery/read callbacks attach by
-- message_id exactly as they do for templates.
--
-- Free-form is only possible inside WhatsApp's 24-hour customer service window
-- (Meta's rule, enforced by Wamafy with 400 NO_OPEN_CONVERSATION). Outside it,
-- only an approved template can be sent -- which is why the admin UI checks the
-- window before enabling the box rather than letting a careful reply bounce.

ALTER TABLE public.whatsapp_sends
  ADD COLUMN IF NOT EXISTS body_text     text,
  -- Who on the team sent it. Replies go out under the business number, so
  -- without this there is no way to tell afterwards who answered.
  ADD COLUMN IF NOT EXISTS sent_by_email text;

CREATE INDEX IF NOT EXISTS whatsapp_sends_freeform_idx
  ON public.whatsapp_sends (to_phone, created_at DESC)
  WHERE template_name IS NULL;
