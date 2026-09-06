-- Let a marketer read WhatsApp threads for their OWN leads in People ▸ Chat.
--
-- Previously both tables were is_admin_strict() SELECT only -- founders could
-- read every conversation, marketers/managers got nothing. That was also load
-- bearing: AdminPanel.tsx's phone->one-booking fallback for attributing old
-- (pre application_id) whatsapp_sends rows assumed the caller sees ALL
-- applications for a phone, which is only true for founders. The client change
-- that accompanies this migration restricts that fallback to adminRole==='admin'
-- so a marketer's necessarily-partial view of a shared phone number can't be
-- mistaken for "this phone has exactly one booking".
--
-- whatsapp_sends already carries application_id, so it scopes exactly via
-- applications.assigned_marketer_id. whatsapp_inbound has no application_id
-- (a WhatsApp message isn't about a booking), so it scopes by phone -- a
-- marketer sees an inbound reply if ANY of their own leads share that phone.

CREATE POLICY "whatsapp_sends_marketer_select"
  ON public.whatsapp_sends FOR SELECT TO authenticated
  USING (
    current_marketer_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = whatsapp_sends.application_id
        AND a.assigned_marketer_id = current_marketer_id()
    )
  );

CREATE POLICY "whatsapp_inbound_marketer_select"
  ON public.whatsapp_inbound FOR SELECT TO authenticated
  USING (
    current_marketer_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.phone = whatsapp_inbound.from_phone
        AND a.assigned_marketer_id = current_marketer_id()
    )
  );
