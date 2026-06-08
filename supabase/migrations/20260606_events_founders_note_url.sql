-- Founder's Note: a per-plan voice note (audio URL, typically Cloudinary).
-- Shown as a play-button section on the plan details page. NULL/empty = hidden.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS founders_note_url text;
