-- Customer replies on WhatsApp.
--
-- Why a separate table: an inbound message is not a send. Routing them through
-- the send log created stub rows with no sent_at, which quietly polluted every
-- delivery-rate query over whatsapp_sends.
--
-- Idempotent on message_id because Wamafy re-delivers, and its webhooks never
-- retry -- so the receiver must answer 2xx even when it has seen the event
-- before, rather than erroring and burning one of the 15 consecutive failures
-- that auto-disable an event subscription.

CREATE TABLE IF NOT EXISTS public.whatsapp_inbound (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider             text NOT NULL DEFAULT 'wamafy',
  message_id           text,
  from_phone           text NOT NULL,        -- last 10 digits, matches applications.phone
  from_name            text,
  msg_type             text,                 -- WhatsApp's own type: text / image / interactive / ...
  body_text            text,
  interactive_reply_id text,                 -- set when the customer tapped a button or list row
  media_id             text,
  media_caption        text,
  conversation_id      text,                 -- Wamafy's thread id
  lead_id              text,                 -- Wamafy's contact id
  referral             jsonb,                -- Click-to-WhatsApp ad context, first message after an ad tap
  -- sent_at is when the CUSTOMER sent it (data.sentAt). Deliberately not the
  -- envelope's occurredAt, which is when Wamafy dispatched the callback --
  -- storing that would record our own dispatch time as the customer's.
  sent_at              timestamptz,
  received_at          timestamptz NOT NULL DEFAULT now(),
  raw                  jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_inbound_message_id_key
  ON public.whatsapp_inbound (message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS whatsapp_inbound_phone_idx
  ON public.whatsapp_inbound (from_phone, sent_at DESC);

ALTER TABLE public.whatsapp_inbound ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_inbound_admin_select"
  ON public.whatsapp_inbound FOR SELECT TO authenticated
  USING (is_admin_strict());

CREATE OR REPLACE FUNCTION public.log_whatsapp_inbound(
  p_secret       text,
  p_message_id   text,
  p_from         text,
  p_from_name    text        DEFAULT NULL,
  p_type         text        DEFAULT NULL,
  p_text         text        DEFAULT NULL,
  p_reply_id     text        DEFAULT NULL,
  p_media_id     text        DEFAULT NULL,
  p_media_cap    text        DEFAULT NULL,
  p_conversation text        DEFAULT NULL,
  p_lead         text        DEFAULT NULL,
  p_referral     jsonb       DEFAULT NULL,
  p_sent_at      timestamptz DEFAULT NULL,
  p_provider     text        DEFAULT 'wamafy',
  p_raw          jsonb       DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF p_secret IS NULL OR p_secret IS DISTINCT FROM (SELECT value FROM public.app_secrets WHERE name = 'whatsapp_log_secret') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  INSERT INTO public.whatsapp_inbound (
    provider, message_id, from_phone, from_name, msg_type, body_text,
    interactive_reply_id, media_id, media_caption, conversation_id, lead_id,
    referral, sent_at, raw
  ) VALUES (
    COALESCE(NULLIF(btrim(p_provider), ''), 'wamafy'),
    p_message_id,
    public.wa_normalise_phone(p_from),
    p_from_name, p_type, p_text,
    p_reply_id, p_media_id, p_media_cap, p_conversation, p_lead,
    p_referral, p_sent_at, p_raw
  )
  ON CONFLICT (message_id) WHERE message_id IS NOT NULL DO NOTHING;
END; $fn$;

REVOKE ALL ON FUNCTION public.log_whatsapp_inbound(text, text, text, text, text, text, text, text, text, text, text, jsonb, timestamptz, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_whatsapp_inbound(text, text, text, text, text, text, text, text, text, text, text, jsonb, timestamptz, text, jsonb) TO anon, authenticated, service_role;
