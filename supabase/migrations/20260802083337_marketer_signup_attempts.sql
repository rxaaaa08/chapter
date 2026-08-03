CREATE TABLE IF NOT EXISTS public.marketer_signup_attempts (
  email      text PRIMARY KEY,
  attempts   timestamptz[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketer_signup_attempts ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies: only the Edge Function's service-role client may
-- read or write rate-limit state. Browser roles receive no table privileges.
REVOKE ALL ON TABLE public.marketer_signup_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.marketer_signup_attempts TO service_role;
