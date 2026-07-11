-- Product roadmap displayed directly below the admin Journey Map.
--
-- The roadmap deliberately separates delivery state from QA state: a feature
-- can be live while still untested, or built while waiting for release. Small
-- copy/logic/bug follow-ups live as tasks under the parent feature, and test
-- runs keep a lightweight history of end-to-end Safari checks.
--
-- Access is strict-admin only. The broader `ops` role is also used by ticket
-- marketers, so using is_admin() here would expose internal product plans.

CREATE TABLE IF NOT EXISTS public.roadmap_features (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  description     text,
  area            text NOT NULL DEFAULT 'General' CHECK (char_length(btrim(area)) BETWEEN 1 AND 80),
  feature_type    text NOT NULL DEFAULT 'feature'
                    CHECK (feature_type IN ('feature', 'improvement', 'bug', 'copy', 'logic', 'technical')),
  priority        text NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('high', 'normal', 'low')),
  delivery_status text NOT NULL DEFAULT 'note'
                    CHECK (delivery_status IN ('note', 'planned', 'building', 'built', 'live', 'paused')),
  qa_status       text NOT NULL DEFAULT 'not_ready'
                    CHECK (qa_status IN ('not_ready', 'ready', 'testing', 'fixes_needed', 'passed', 'not_required')),
  target_date     date,
  release_id      bigint REFERENCES public.feature_releases(id) ON DELETE SET NULL,
  archived        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_features_active_updated_idx
  ON public.roadmap_features (archived, updated_at DESC);
CREATE INDEX IF NOT EXISTS roadmap_features_qa_status_idx
  ON public.roadmap_features (qa_status) WHERE archived = false;

CREATE TABLE IF NOT EXISTS public.roadmap_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id   uuid NOT NULL REFERENCES public.roadmap_features(id) ON DELETE CASCADE,
  title        text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 300),
  kind         text NOT NULL DEFAULT 'todo'
                 CHECK (kind IN ('todo', 'test', 'bug', 'copy', 'logic')),
  done         boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS roadmap_tasks_feature_sort_idx
  ON public.roadmap_tasks (feature_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS public.roadmap_test_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id  uuid NOT NULL REFERENCES public.roadmap_features(id) ON DELETE CASCADE,
  result      text NOT NULL CHECK (result IN ('passed', 'fixes_needed', 'blocked')),
  environment text NOT NULL DEFAULT 'Safari on laptop',
  notes       text,
  tested_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_test_runs_feature_tested_idx
  ON public.roadmap_test_runs (feature_id, tested_at DESC);

ALTER TABLE public.roadmap_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_test_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_features_admin_all ON public.roadmap_features;
CREATE POLICY roadmap_features_admin_all ON public.roadmap_features
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_strict()))
  WITH CHECK ((SELECT public.is_admin_strict()));

DROP POLICY IF EXISTS roadmap_tasks_admin_all ON public.roadmap_tasks;
CREATE POLICY roadmap_tasks_admin_all ON public.roadmap_tasks
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_strict()))
  WITH CHECK ((SELECT public.is_admin_strict()));

DROP POLICY IF EXISTS roadmap_test_runs_admin_all ON public.roadmap_test_runs;
CREATE POLICY roadmap_test_runs_admin_all ON public.roadmap_test_runs
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_strict()))
  WITH CHECK ((SELECT public.is_admin_strict()));

-- Data API privileges are separate from RLS. These grants make the tables
-- reachable to signed-in admins while the policies above still reject every
-- non-admin and all anonymous traffic.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_features TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_test_runs TO authenticated;
