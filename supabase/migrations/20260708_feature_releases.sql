-- Experiments tab, Layer 1: the feature-release log.
--
-- Why: the founder needs to line up "what changed on the site" with "what the
-- numbers did". Git knows the dates but the analytics tab doesn't. This table
-- is the bridge: one row per shipped change, rendered as marker lines on the
-- Experiments-tab charts and as the anchor for Before/After comparisons.
--
-- Three sources of rows:
--   'backfill' — the historical releases inserted below (dates from git log)
--   'git'      — auto-logged by the GitHub Action on every push to main, via
--                the secret-guarded log_feature_release() RPC (anon can call
--                it, but only with the shared secret from app_secrets — same
--                pattern as admin_push_secret in 20260601_c3)
--   'manual'   — added/edited by the admin from the Experiments tab

CREATE TABLE IF NOT EXISTS public.feature_releases (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  released_at     date NOT NULL,
  title           text NOT NULL,
  description     text,
  area            text,           -- form / payment / email / homepage / open-flow / analytics / ...
  expected_effect text,           -- what the founder hoped it would do
  source          text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','git','backfill')),
  commit_hash     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- The GitHub Action retries on network flakes; one row per commit, ever.
CREATE UNIQUE INDEX IF NOT EXISTS feature_releases_commit_hash_key
  ON public.feature_releases (commit_hash) WHERE commit_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS feature_releases_released_at_idx
  ON public.feature_releases (released_at DESC);

ALTER TABLE public.feature_releases ENABLE ROW LEVEL SECURITY;

-- Same gate as flow_analytics reads: the Analytics/Experiments tabs are
-- admin-strict territory (ops role doesn't see them).
CREATE POLICY "feature_releases_admin_select"
  ON public.feature_releases FOR SELECT TO authenticated
  USING (is_admin_strict());

CREATE POLICY "feature_releases_admin_write"
  ON public.feature_releases FOR ALL TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());

-- ── Secret-guarded RPC for the GitHub Action ─────────────────────────────────

INSERT INTO public.app_secrets (name, value)
VALUES ('release_log_secret', 'TFVuuL1qm0pvgNAOVsH7KbfN20Mj3GMSaQCuuFu7hKQRsXUdwtJUOk0zFYS5hJdZ')
ON CONFLICT (name) DO NOTHING;  -- never clobber a rotated secret on re-run

CREATE OR REPLACE FUNCTION public.log_feature_release(
  p_secret      text,
  p_title       text,
  p_commit      text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_released_at date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_secret IS NULL
     OR p_secret IS DISTINCT FROM (SELECT value FROM public.app_secrets WHERE name = 'release_log_secret') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'title required';
  END IF;
  -- Release day in IST: pushes late at night should log under the founder's
  -- calendar day, matching how analytics_daily buckets days.
  INSERT INTO public.feature_releases (released_at, title, description, source, commit_hash)
  VALUES (
    COALESCE(p_released_at, (now() AT TIME ZONE 'Asia/Kolkata')::date),
    left(btrim(p_title), 200),
    left(p_description, 2000),
    'git',
    p_commit
  )
  ON CONFLICT (commit_hash) WHERE commit_hash IS NOT NULL DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.log_feature_release(text, text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_feature_release(text, text, text, text, date) TO anon, authenticated, service_role;

-- ── Backfill: the releases we know from git history ──────────────────────────

INSERT INTO public.feature_releases (released_at, title, description, area, expected_effect, source, commit_hash) VALUES
  ('2026-06-03', 'Conversion-funnel tracking added',
   'application_started/application_submitted analytics events began. All funnel data starts here — nothing measurable exists before this date.',
   'analytics', 'Baseline — makes form completion measurable', 'backfill', '83f84a6'),
  ('2026-06-22', 'Doubt-to-invite flow + application form field changes',
   'Doubt submissions can convert into invites; application form fields reworked.',
   'form', 'Smoother path from doubt to booking', 'backfill', '2fb28f9'),
  ('2026-06-28', 'Single-page application form',
   'The multi-step application form became a single page with fewer questions.',
   'form', 'Raise form completion rate', 'backfill', '5588ac1'),
  ('2026-07-04', 'Open-event flow + creator affiliate links',
   'PayU-hosted open events (no approval step) and creator @handle affiliate links went live.',
   'open-flow', 'New booking flow + creator-driven traffic', 'backfill', 'fe27355'),
  ('2026-07-05', 'Invite form collects Email instead of Gender',
   'Swapped the Gender question for an Email field on the invite application form.',
   'form', 'Enable email re-engagement without adding friction', 'backfill', '3166070'),
  ('2026-07-06', 'Email invites + cart-abandonment emails (Brevo)',
   'Approval invites and cart-abandonment nudges now also go out by email alongside WhatsApp.',
   'email', 'Better re-engagement, faster invite-to-paid', 'backfill', '3b82e10')
ON CONFLICT (commit_hash) WHERE commit_hash IS NOT NULL DO NOTHING;
