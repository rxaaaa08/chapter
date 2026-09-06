-- Remove the Product Roadmap feature.
--
-- The owner stopped using the roadmap board (2026-09-02). It was the top half of
-- the admin Build tab; the journey maps and the standalone to-do list stay.
--
-- What this deliberately does NOT touch:
--   * feature_releases — the push/release log behind the Growth ▸ Experiments
--     tab. The roadmap read FROM it, never the other way round, so the release
--     log and the GitHub Action that feeds it are unaffected.
--   * product_todos — the to-do list survives. Only its unused link to a roadmap
--     card is dropped; no to-do row actually used it (0 of 14 had feature_id set
--     when this was applied).
--
-- The trigger goes first and matters most: it fired on EVERY push to main and
-- inserted a "Need Testing" card, so leaving it would keep writing rows into a
-- table nothing reads any more.
--
-- Data archived to JSON before dropping (252 features, 52 tasks, 3 test runs).
-- This is irreversible: re-running the older roadmap migrations would recreate
-- empty tables, not the rows.

-- 1. Stop the release log mirroring itself onto the roadmap.
DROP TRIGGER IF EXISTS feature_releases_sync_roadmap ON public.feature_releases;
DROP FUNCTION IF EXISTS public.sync_release_to_roadmap();

-- 2. Unlink the to-do list from the roadmap (kept table, dropped column).
ALTER TABLE public.product_todos DROP COLUMN IF EXISTS feature_id;

-- 3. Drop the roadmap tables, children first.
--    roadmap_tasks / roadmap_test_runs were already unread by the UI; the
--    2026-07-11 simplification left them behind rather than removing them.
DROP TABLE IF EXISTS public.roadmap_test_runs;
DROP TABLE IF EXISTS public.roadmap_tasks;
DROP TABLE IF EXISTS public.roadmap_features;
