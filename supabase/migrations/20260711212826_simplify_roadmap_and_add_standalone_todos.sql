-- A deliberately small shared to-do list. A task can optionally belong to a
-- roadmap feature, but every open task is visible in the same main working
-- list. There is still no ownership, priority, category or due date.

CREATE TABLE public.product_todos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 300),
  feature_id   uuid REFERENCES public.roadmap_features(id) ON DELETE SET NULL,
  done         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX product_todos_open_created_idx
  ON public.product_todos (done, created_at DESC);

CREATE INDEX product_todos_feature_created_idx
  ON public.product_todos (feature_id, created_at DESC)
  WHERE feature_id IS NOT NULL;

ALTER TABLE public.product_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_todos_admin_all ON public.product_todos
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_strict()))
  WITH CHECK ((SELECT public.is_admin_strict()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_todos TO authenticated;

-- Preserve genuine unfinished follow-ups as standalone to-dos. The generated
-- testing reminder is intentionally omitted because Need Testing now provides
-- that signal directly on the roadmap.
INSERT INTO public.product_todos (title, feature_id, created_at)
SELECT DISTINCT ON (task.feature_id, lower(btrim(task.title)))
  btrim(task.title), task.feature_id, task.created_at
FROM public.roadmap_tasks task
WHERE task.done = false
  AND lower(btrim(task.title)) <> 'run a live test and record the result'
ORDER BY task.feature_id, lower(btrim(task.title)), task.created_at DESC;

-- Collapse the roadmap into the only three states the team needs.
UPDATE public.roadmap_features
SET status = CASE
  WHEN status = 'complete' THEN 'complete'
  WHEN status IN ('live_test', 'fixes_needed') THEN 'live_test'
  ELSE 'building'
END;

ALTER TABLE public.roadmap_features
  DROP CONSTRAINT roadmap_features_status_check,
  ALTER COLUMN status SET DEFAULT 'building',
  ADD CONSTRAINT roadmap_features_status_check
    CHECK (status IN ('building', 'live_test', 'complete'));

-- New releases still enter at Need Testing, but no feature-linked checklist
-- item is created. Small follow-ups belong in product_todos instead.
CREATE OR REPLACE FUNCTION public.sync_release_to_roadmap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.roadmap_features f WHERE f.release_id = NEW.id)
     OR EXISTS (SELECT 1 FROM public.roadmap_features f
                WHERE lower(btrim(f.title)) = lower(btrim(NEW.title))) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.roadmap_features
    (title, description, area, feature_type, status, release_id)
  VALUES (
    left(btrim(NEW.title), 200),
    'Added automatically from the release log (' || NEW.source
      || coalesce(' · commit ' || NEW.commit_hash, '')
      || ' on ' || to_char(NEW.released_at, 'DD Mon YYYY') || ').',
    left(coalesce(nullif(btrim(NEW.area), ''), 'General'), 80),
    CASE WHEN NEW.title ~* '^(fix|repair|correct)' THEN 'bug' ELSE 'feature' END,
    'live_test',
    NEW.id
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_release_to_roadmap() FROM PUBLIC, anon, authenticated;
