-- One-time WhatsApp verification for the public (PayU-hosted) booking flow.
-- Rows are only read/written by service-role Edge Functions; the browser only
-- ever receives the opaque verification_token returned after an OTP is sent.

CREATE TABLE public.open_event_otp_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_token text NOT NULL UNIQUE,
  event_slug         text NOT NULL,
  phone              text NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  email              text NOT NULL,
  code_hash          text NOT NULL,
  expires_at         timestamptz NOT NULL,
  attempts           smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  verified_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX open_event_otp_sessions_lookup_idx
  ON public.open_event_otp_sessions (verification_token, expires_at);

CREATE INDEX open_event_otp_sessions_rate_idx
  ON public.open_event_otp_sessions (phone, created_at DESC);

ALTER TABLE public.open_event_otp_sessions ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: OTPs and session tokens must never be
-- readable via the Data API. Edge Functions use service_role and bypass RLS.
