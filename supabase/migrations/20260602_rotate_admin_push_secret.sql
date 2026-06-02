-- Rotate admin_push_secret.
--
-- The previous value was committed in plaintext to migration
-- 20260601_c3_admin_push_secret.sql:32 — anyone with git history can read it.
-- Rotate now so that secret is no longer the live one.
--
-- The new value is generated at apply time via gen_random_bytes(48) so it
-- never appears in source. After this migration runs:
--   1. Read the new value:  SELECT value FROM public.app_secrets WHERE name='admin_push_secret';
--   2. Update the Supabase Edge Function secret ADMIN_PUSH_SECRET (on the
--      send-admin-push function) to match.
--   3. notify_admin_push() will keep working because it always reads the
--      live value from app_secrets via SECURITY DEFINER.

UPDATE public.app_secrets
SET value      = encode(gen_random_bytes(48), 'base64'),
    updated_at = now()
WHERE name = 'admin_push_secret';
