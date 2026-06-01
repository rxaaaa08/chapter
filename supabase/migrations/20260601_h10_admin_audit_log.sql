-- H10: Admin audit log.
--
-- Today, nothing records who marked which payment paid, who deleted
-- an event, or who added/removed someone from invited_numbers. If
-- something gets corrupted (or contested), there's no way to trace
-- the chain back.
--
-- This adds:
--   * public.admin_audit_log table — append-only event log
--   * public.log_admin_action() SECURITY DEFINER helper — clients call
--     this RPC; the function reads the caller's email from
--     auth.jwt() and enforces is_admin() server-side, so an attacker
--     can't fake log entries even if RLS were misconfigured.
--
-- RLS:
--   * INSERT: nobody from anon/authenticated (the fn runs SECURITY
--     DEFINER as owner, bypassing RLS to write).
--   * SELECT: is_admin() — both admin and ops can see the trail.
--   * UPDATE / DELETE: nobody (append-only).

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email   text        NOT NULL,
  action        text        NOT NULL,
  target_table  text,
  target_id     text,
  details       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_email_idx
  ON public.admin_audit_log (admin_email);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx
  ON public.admin_audit_log (action);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log_admin_select"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (is_admin());

-- No INSERT/UPDATE/DELETE policies — clients can never touch the table
-- directly. All writes go through log_admin_action(), which runs as
-- the owner (SECURITY DEFINER) and inserts on behalf of the caller.

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action       text,
  p_target_table text DEFAULT NULL,
  p_target_id    text DEFAULT NULL,
  p_details      jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email text := (auth.jwt() ->> 'email');
  new_id       uuid;
BEGIN
  IF caller_email IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: not an admin';
  END IF;
  IF p_action IS NULL OR length(trim(p_action)) = 0 THEN
    RAISE EXCEPTION 'p_action is required';
  END IF;

  INSERT INTO public.admin_audit_log (admin_email, action, target_table, target_id, details)
  VALUES (caller_email, p_action, p_target_table, p_target_id, COALESCE(p_details, '{}'::jsonb))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb)
  TO authenticated, service_role;
