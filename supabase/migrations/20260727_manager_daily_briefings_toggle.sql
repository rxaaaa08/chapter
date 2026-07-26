-- Global on/off switch for the Daily Manager 6pm brief.
--
-- The owner is still building systems, not running operations, so the evening
-- briefing + push isn't useful yet. Rather than disable each rule one by one
-- (which still fires an empty brief + push), this adds one global flag and a
-- thin cron wrapper that early-returns when it's off. The 700-line rule engine
-- (evaluate_manager_rules) is left completely untouched.

CREATE TABLE IF NOT EXISTS public.manager_settings (
  id                      boolean PRIMARY KEY DEFAULT true,
  daily_briefings_enabled boolean NOT NULL DEFAULT true,
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manager_settings_singleton CHECK (id)
);

INSERT INTO public.manager_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.manager_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manager_settings_admin_select" ON public.manager_settings;
CREATE POLICY "manager_settings_admin_select"
  ON public.manager_settings FOR SELECT TO authenticated
  USING (is_admin_strict());

DROP POLICY IF EXISTS "manager_settings_admin_update" ON public.manager_settings;
CREATE POLICY "manager_settings_admin_update"
  ON public.manager_settings FOR UPDATE TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());
-- No INSERT/DELETE from the client: the single row ships here and stays.

-- Thin cron entrypoint: run the 6pm evaluation only when briefings are enabled.
CREATE OR REPLACE FUNCTION public.run_daily_manager_brief()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE((SELECT daily_briefings_enabled FROM public.manager_settings WHERE id), true) THEN
    RETURN 0;
  END IF;
  RETURN public.evaluate_manager_rules();
END
$$;

REVOKE ALL ON FUNCTION public.run_daily_manager_brief() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_daily_manager_brief() TO service_role;

-- Repoint the existing 18:00 IST job at the guarded wrapper.
SELECT cron.unschedule('daily_manager_brief');
SELECT cron.schedule('daily_manager_brief', '30 12 * * *', $$SELECT public.run_daily_manager_brief()$$);
