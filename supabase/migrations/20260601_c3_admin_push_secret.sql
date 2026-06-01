-- C3: Lock the send-admin-push edge function behind a shared secret.
--
-- Today the function is deployed with verify_jwt=false, which means
-- anyone who knows the URL can POST a notification payload and trigger
-- a push to every admin device — a free spam + phishing vector
-- ("💸 Click here: phishing.url" delivered to admins' lock screens).
--
-- Fix: notify_admin_push() injects an X-Admin-Push-Secret header on
-- every pg_net call; the edge function rejects any request that
-- doesn't match. Internet traffic without the secret gets a 401
-- before any notification is built.
--
-- The secret lives in two places:
--   - public.app_secrets row name='admin_push_secret' (read by
--     notify_admin_push via SECURITY DEFINER). app_secrets has RLS
--     on with zero policies, so anon/authenticated cannot read it;
--     service_role bypasses RLS.
--   - Supabase Edge Function secret ADMIN_PUSH_SECRET (read by the
--     deployed function via Deno.env.get()).
-- Both must be the same value. Rotate by updating both in lockstep.

CREATE TABLE IF NOT EXISTS public.app_secrets (
  name       text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies — anon/authenticated cannot see this table.

INSERT INTO public.app_secrets (name, value)
VALUES ('admin_push_secret', 'ru8pZHqzhRL-zMqC3SLAApy__SIyUeSqxl5KR6IIUpOkuTxiuSz0-mQRT3ZGnEkV')
ON CONFLICT (name) DO UPDATE
  SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE FUNCTION public.notify_admin_push(payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  req_id bigint;
  secret text;
BEGIN
  SELECT value INTO secret FROM public.app_secrets WHERE name = 'admin_push_secret';
  SELECT net.http_post(
    url     := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/send-admin-push',
    headers := jsonb_build_object(
      'Content-Type',        'application/json',
      'X-Admin-Push-Secret', COALESCE(secret, '')
    ),
    body    := payload
  ) INTO req_id;
  RETURN req_id;
END;
$$;
