-- Replace the two-axis delivery/QA model with the shared five-step workflow
-- used by the two-person team. Testing happens on the live website, so
-- "live_test" explicitly means deployed and waiting for a live test.

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.roadmap_features
  ADD COLUMN status text;

-- Preserve sensible meaning if rows were created before this migration.
UPDATE public.roadmap_features
SET status = CASE
  WHEN qa_status = 'passed' THEN 'complete'
  WHEN qa_status = 'fixes_needed' THEN 'fixes_needed'
  WHEN delivery_status = 'live' THEN 'live_test'
  WHEN delivery_status IN ('building', 'built') THEN 'building'
  ELSE 'idea'
END;

ALTER TABLE public.roadmap_features
  ALTER COLUMN status SET DEFAULT 'idea',
  ALTER COLUMN status SET NOT NULL,
  ADD CONSTRAINT roadmap_features_status_check
    CHECK (status IN ('idea', 'building', 'live_test', 'fixes_needed', 'complete'));

DROP INDEX IF EXISTS public.roadmap_features_qa_status_idx;

ALTER TABLE public.roadmap_features
  DROP COLUMN delivery_status,
  DROP COLUMN qa_status;

CREATE INDEX roadmap_features_status_idx
  ON public.roadmap_features (status) WHERE archived = false;

ALTER TABLE public.roadmap_test_runs
  ALTER COLUMN environment SET DEFAULT 'Live website';
