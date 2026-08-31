-- WhatsApp send + delivery log (provider-agnostic).
--
-- Why: we have never recorded a single WhatsApp message. Sends are fire-and-
-- forget with console.log only, and five aisensy_*_sent booleans. That makes
-- delivery unmeasurable, so "is the new BSP better than AiSensy?" is currently
-- unanswerable. This table is the missing baseline.
--
-- Written for the Wamafy trial but deliberately provider-neutral: `provider`
-- distinguishes rows so AiSensy can be logged here later and compared like for
-- like, on the same axes.
--
-- SAFETY: purely additive. No existing table, function or code path is touched.
-- Nothing reads these tables yet, so this cannot affect a live booking.

CREATE TABLE IF NOT EXISTS public.whatsapp_sends (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider         text NOT NULL DEFAULT 'wamafy',
  message_id       text,                 -- wamid from the provider's send response
  to_phone         text NOT NULL,        -- last 10 digits, matching applications.phone
  template_name    text,
  variables        jsonb,
  -- Optional join back to a booking. Nullable on purpose: the test harness
  -- sends to a bare number with no application behind it.
  application_id   uuid,
  -- Status timestamps rather than a single status column. Wamafy warns that
  -- order is NOT guaranteed (read can arrive before delivered) and that a
  -- status can repeat, so a "current status" field would flap. Separate
  -- write-once columns make the handler naturally idempotent.
  sent_at          timestamptz,          -- from the send RESPONSE; never webhooked
  delivered_at     timestamptz,
  read_at          timestamptz,
  failed_at        timestamptz,
  error_code       text,
  error_message    text,
  send_ok          boolean,
  send_http_status integer,
  raw_send         jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- One row per provider message. Partial so pre-send stub rows can't collide.
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_sends_message_id_key
  ON public.whatsapp_sends (message_id) WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS whatsapp_sends_phone_idx
  ON public.whatsapp_sends (to_phone, created_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_sends_template_idx
  ON public.whatsapp_sends (provider, template_name, created_at DESC);

-- Append-only raw callback log. Kept separate so a malformed or unexpected
-- payload is still captured even when it matches no send row -- during a BSP
-- trial the payloads we did NOT anticipate are the valuable ones.
CREATE TABLE IF NOT EXISTS public.whatsapp_send_events (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider     text NOT NULL DEFAULT 'wamafy',
  message_id   text,
  event        text,
  status       text,
  payload      jsonb,
  received_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_send_events_message_idx
  ON public.whatsapp_send_events (message_id, received_at DESC);

ALTER TABLE public.whatsapp_sends       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_send_events ENABLE ROW LEVEL SECURITY;

-- Founder-only reads, same gate as feature_releases / analytics. No anon or
-- ops access, and no write policy at all: every write goes through the
-- SECURITY DEFINER RPCs below, which require the shared secret.
CREATE POLICY "whatsapp_sends_admin_select"
  ON public.whatsapp_sends FOR SELECT TO authenticated
  USING (is_admin_strict());

CREATE POLICY "whatsapp_send_events_admin_select"
  ON public.whatsapp_send_events FOR SELECT TO authenticated
  USING (is_admin_strict());

-- ── Shared secret for the Vercel test routes ─────────────────────────────────
-- Same pattern as release_log_secret / admin_push_secret: the Vercel function
-- holds this string, not the service-role key. A leak lets someone write junk
-- rows into a log table; it does not hand over the database.

INSERT INTO public.app_secrets (name, value)
VALUES ('whatsapp_log_secret', 'BcxZnD3EMoXnXkAmdpvpTEU_sKSaiHeHWuZEQFbe1Lypemq6HIdrWdrN9lh-i5Z4')
ON CONFLICT (name) DO NOTHING;  -- never clobber a rotated secret on re-run

-- Last 10 digits, matching how applications.phone is stored everywhere else.
CREATE OR REPLACE FUNCTION public.wa_normalise_phone(p_phone text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$ SELECT right(regexp_replace(coalesce(p_phone,''), '\D', '', 'g'), 10) $$;

-- ── Record a send ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_whatsapp_send(
  p_secret      text,
  p_provider    text,
  p_message_id  text,
  p_to          text,
  p_template    text    DEFAULT NULL,
  p_variables   jsonb   DEFAULT NULL,
  p_ok          boolean DEFAULT NULL,
  p_http_status integer DEFAULT NULL,
  p_raw         jsonb   DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id bigint;
BEGIN
  IF p_secret IS NULL
     OR p_secret IS DISTINCT FROM (SELECT value FROM public.app_secrets WHERE name = 'whatsapp_log_secret') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- A status callback can beat the send response back to us, in which case a
  -- stub row already exists for this message_id. Fill it in rather than
  -- colliding on the unique index and losing the send metadata.
  IF p_message_id IS NOT NULL THEN
    UPDATE public.whatsapp_sends
       SET template_name    = COALESCE(template_name, p_template),
           variables        = COALESCE(variables, p_variables),
           sent_at          = COALESCE(sent_at, now()),
           send_ok          = COALESCE(p_ok, send_ok),
           send_http_status = COALESCE(p_http_status, send_http_status),
           raw_send         = COALESCE(p_raw, raw_send),
           updated_at       = now()
     WHERE message_id = p_message_id
     RETURNING id INTO v_id;

    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END IF;

  INSERT INTO public.whatsapp_sends (
    provider, message_id, to_phone, template_name, variables,
    sent_at, send_ok, send_http_status, raw_send
  ) VALUES (
    COALESCE(NULLIF(btrim(p_provider), ''), 'wamafy'),
    p_message_id,
    public.wa_normalise_phone(p_to),
    p_template,
    p_variables,
    CASE WHEN COALESCE(p_ok, false) THEN now() ELSE NULL END,
    p_ok,
    p_http_status,
    p_raw
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ── Record a delivery/read/failed callback ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_whatsapp_status(
  p_secret        text,
  p_message_id    text,
  p_status        text,
  p_error_code    text        DEFAULT NULL,
  p_error_message text        DEFAULT NULL,
  p_occurred_at   timestamptz DEFAULT NULL,
  p_to            text        DEFAULT NULL,
  p_template      text        DEFAULT NULL,
  p_provider      text        DEFAULT 'wamafy',
  p_raw           jsonb       DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ts     timestamptz := COALESCE(p_occurred_at, now());
  v_status text        := lower(btrim(coalesce(p_status, '')));
  v_hit    bigint;
BEGIN
  IF p_secret IS NULL
     OR p_secret IS DISTINCT FROM (SELECT value FROM public.app_secrets WHERE name = 'whatsapp_log_secret') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Always keep the raw callback, even if it matches nothing. During a trial an
  -- unmatched payload is a finding, not noise.
  INSERT INTO public.whatsapp_send_events (provider, message_id, event, status, payload)
  VALUES (COALESCE(p_provider, 'wamafy'), p_message_id, 'message.status', v_status, p_raw);

  IF p_message_id IS NULL THEN
    RETURN;
  END IF;

  -- COALESCE on every timestamp is what makes this idempotent: Wamafy warns
  -- statuses repeat and arrive out of order, so first-write-wins per status.
  UPDATE public.whatsapp_sends
     SET delivered_at  = CASE WHEN v_status = 'delivered' THEN COALESCE(delivered_at, v_ts) ELSE delivered_at END,
         read_at       = CASE WHEN v_status = 'read'      THEN COALESCE(read_at,      v_ts) ELSE read_at      END,
         failed_at     = CASE WHEN v_status = 'failed'    THEN COALESCE(failed_at,    v_ts) ELSE failed_at    END,
         error_code    = COALESCE(p_error_code, error_code),
         error_message = COALESCE(p_error_message, error_message),
         updated_at    = now()
   WHERE message_id = p_message_id
   RETURNING id INTO v_hit;

  -- Callback arrived before we logged the send. Create the stub so the status
  -- is not lost; log_whatsapp_send() will fill in the rest when it lands.
  IF v_hit IS NULL THEN
    INSERT INTO public.whatsapp_sends (
      provider, message_id, to_phone, template_name,
      delivered_at, read_at, failed_at, error_code, error_message
    ) VALUES (
      COALESCE(p_provider, 'wamafy'),
      p_message_id,
      public.wa_normalise_phone(COALESCE(p_to, '')),
      p_template,
      CASE WHEN v_status = 'delivered' THEN v_ts END,
      CASE WHEN v_status = 'read'      THEN v_ts END,
      CASE WHEN v_status = 'failed'    THEN v_ts END,
      p_error_code,
      p_error_message
    )
    ON CONFLICT (message_id) WHERE message_id IS NOT NULL DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.log_whatsapp_send(text, text, text, text, text, jsonb, boolean, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_whatsapp_send(text, text, text, text, text, jsonb, boolean, integer, jsonb) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_whatsapp_status(text, text, text, text, text, timestamptz, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_whatsapp_status(text, text, text, text, text, timestamptz, text, text, text, jsonb) TO anon, authenticated, service_role;
