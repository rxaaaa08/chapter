-- Sync the release log into the product roadmap.
--
-- The GitHub Action logs pushes to main into feature_releases, while admins can
-- also add curated releases manually. This trigger mirrors every release onto
-- the roadmap as a Need Testing card linked through release_id, so nothing in
-- Experiments can silently skip the testing board.
--
-- Dedup rules (same as the curated backfill): skip when a roadmap feature
-- already points at this release, or shares the exact title.
-- Deleting a release-log row from the Experiments tab keeps the roadmap card
-- (release_id just goes NULL via the existing ON DELETE SET NULL).

CREATE OR REPLACE FUNCTION public.sync_release_to_roadmap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_feature_id uuid;
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
  )
  RETURNING id INTO new_feature_id;

  INSERT INTO public.roadmap_tasks (feature_id, title, kind, sort_order)
  VALUES (new_feature_id, 'Run a live test and record the result', 'test', 0);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feature_releases_sync_roadmap ON public.feature_releases;
CREATE TRIGGER feature_releases_sync_roadmap
  AFTER INSERT ON public.feature_releases
  FOR EACH ROW EXECUTE FUNCTION public.sync_release_to_roadmap();

-- This is trigger-only privileged code, not a public RPC endpoint.
REVOKE ALL ON FUNCTION public.sync_release_to_roadmap() FROM PUBLIC;

-- ── One-time catch-up ─────────────────────────────────────────────────────────
-- Git releases logged before the trigger existed get the same treatment.
-- created_at/updated_at mirror the push date (noon IST, matching the curated
-- backfill) so the board keeps sorting by when things actually shipped.

-- Link any same-title card that predates release syncing, plus the curated
-- email-system card whose broader title intentionally groups several commits.
UPDATE public.roadmap_features feature
SET release_id = release.id
FROM public.feature_releases release
WHERE feature.release_id IS NULL
  AND lower(btrim(feature.title)) = lower(btrim(release.title))
  AND NOT EXISTS (
    SELECT 1 FROM public.roadmap_features linked WHERE linked.release_id = release.id
  );

UPDATE public.roadmap_features feature
SET release_id = release.id
FROM public.feature_releases release
WHERE feature.release_id IS NULL
  AND feature.title = 'Email capture, invites, abandonment and tracking'
  AND release.commit_hash = '3166070'
  AND NOT EXISTS (
    SELECT 1 FROM public.roadmap_features linked WHERE linked.release_id = release.id
  );

WITH missing AS (
  SELECT fr.*
  FROM public.feature_releases fr
  WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_features f WHERE f.release_id = fr.id)
    AND NOT EXISTS (SELECT 1 FROM public.roadmap_features f
                    WHERE lower(btrim(f.title)) = lower(btrim(fr.title)))
),
inserted AS (
  INSERT INTO public.roadmap_features
    (title, description, area, feature_type, status, release_id, created_at, updated_at)
  SELECT
    left(btrim(m.title), 200),
    'Added automatically from the release log (' || m.source
      || coalesce(' · commit ' || m.commit_hash, '')
      || ' on ' || to_char(m.released_at, 'DD Mon YYYY') || ').',
    left(coalesce(nullif(btrim(m.area), ''), 'General'), 80),
    CASE WHEN m.title ~* '^(fix|repair|correct)' THEN 'bug' ELSE 'feature' END,
    CASE WHEN m.released_at < date '2026-07-04' THEN 'complete' ELSE 'live_test' END,
    m.id,
    (m.released_at + time '12:00') AT TIME ZONE 'Asia/Kolkata',
    (m.released_at + time '12:00') AT TIME ZONE 'Asia/Kolkata'
  FROM missing m
  RETURNING id, status
)
INSERT INTO public.roadmap_tasks (feature_id, title, kind, sort_order)
SELECT id, 'Run a live test and record the result', 'test', 0
FROM inserted
WHERE status = 'live_test';
