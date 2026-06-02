-- Drop all anon policies on the event-images storage bucket.
--
-- Before this migration, public.storage.objects had FOUR policies all granted
-- to the {public} role (i.e., anonymous internet visitors):
--   * "Anon delete event-images"  DELETE  — anyone could delete any image
--   * "Anon update event-images"  UPDATE  — anyone could replace any image
--   * "Anon upload event-images"  INSERT  — anyone could upload to our bucket
--   * "Public read event-images"  SELECT  — anyone could list bucket contents
--
-- This was a critical exposure: a visitor could delete all 41 hero images and
-- 404 the site, or replace event photos with phishing/offensive content.
--
-- Public buckets serve files via /storage/v1/object/public/<bucket>/<path>
-- without needing a SELECT policy — that path bypasses RLS. So dropping these
-- policies leaves existing image URLs working, but closes the read/write/
-- delete attack surface to anon callers. Admin writes are dead-code now that
-- the file-upload UI is removed; if it's ever revived, an admin-only WITH
-- CHECK policy can be added.

DROP POLICY IF EXISTS "Public read event-images"  ON storage.objects;
DROP POLICY IF EXISTS "Anon delete event-images"  ON storage.objects;
DROP POLICY IF EXISTS "Anon update event-images"  ON storage.objects;
DROP POLICY IF EXISTS "Anon upload event-images"  ON storage.objects;
