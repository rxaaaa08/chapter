-- "Seen" tracking for the creator-video review queue.
--
-- The founders' queue shows a dot on any creator who has a video the founder
-- hasn't looked at yet. "Looked at" = opened the video link (or reviewed it).
-- This is independent of approve/ask-changes: a video can be seen but not yet
-- decided on. seen_at is a single shared stamp (first founder to open it clears
-- the dot for both) — right for a two-founder queue.
--
-- Writes come from the admin client, which already updates this table under the
-- creator_submissions_admin_all (is_admin_strict) policy.

ALTER TABLE public.creator_submissions
  ADD COLUMN IF NOT EXISTS seen_at timestamptz;

-- Backfill: anything already reviewed was, by definition, already seen. Leave
-- unreviewed rows unseen so the queue's dots start out truthful.
UPDATE public.creator_submissions
   SET seen_at = reviewed_at
 WHERE reviewed_at IS NOT NULL
   AND seen_at IS NULL;
