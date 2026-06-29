-- ============================================================================
-- Backfill doubt_submissions.event_id for legacy rows.
-- ============================================================================
-- Doubts are now linked to a plan via the stable event_id (slug) the client
-- writes at submit time, not the volatile event_title string. When a plan was
-- renamed (e.g. "Anna Nagar Meetup" → "Chill Sunday Meetup ") the title-based
-- lookup orphaned all the doubts that were submitted before event_id was
-- populated. This fills those rows in so the admin Doubts tab groups them
-- under the current plan name.
--
-- Strategy, in order:
--   1. If another doubt with the same event_title already has event_id,
--      copy that value across (handles renames where some rows are tagged
--      and others aren't).
--   2. Otherwise match event_title to events.title (case-insensitive) and
--      use that slug.
-- event_title is left untouched as a permanent snapshot of what the user saw.

UPDATE doubt_submissions ds
   SET event_id = peer.eid
  FROM (
    SELECT lower(trim(event_title)) AS k, max(event_id) AS eid
      FROM doubt_submissions
     WHERE event_id IS NOT NULL AND event_id <> ''
     GROUP BY lower(trim(event_title))
  ) peer
 WHERE (ds.event_id IS NULL OR ds.event_id = '')
   AND peer.k = lower(trim(ds.event_title));

UPDATE doubt_submissions ds
   SET event_id = ev.slug
  FROM events ev
 WHERE (ds.event_id IS NULL OR ds.event_id = '')
   AND lower(trim(ev.title)) = lower(trim(ds.event_title));
