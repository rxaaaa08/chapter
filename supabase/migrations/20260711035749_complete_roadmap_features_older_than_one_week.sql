-- On 11 July 2026, treat every roadmap feature from before 4 July (IST) as
-- accepted/complete. Preserve the historical updated_at value so the backfill
-- continues to sort by when each capability shipped instead of making thirty
-- old features all look newly added today.

UPDATE public.roadmap_features
SET status = 'complete'
WHERE created_at < timestamptz '2026-07-04 00:00:00+05:30'
  AND status <> 'complete';

-- Close only the generic task created by the git backfill. Do not touch any
-- real copy, logic, bug or testing tasks added manually later.
UPDATE public.roadmap_tasks task
SET done = true,
    completed_at = COALESCE(task.completed_at, now())
FROM public.roadmap_features feature
WHERE task.feature_id = feature.id
  AND feature.created_at < timestamptz '2026-07-04 00:00:00+05:30'
  AND task.title = 'Run a live test and record the result'
  AND task.done = false;
