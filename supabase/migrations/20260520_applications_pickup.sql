-- Add pickup point + date choice to applications
-- When a user submits the native application form they choose a date and
-- a meeting/pickup point.  We persist those here so that the invite-payment
-- flow can surface exactly the right essentials card once they're approved.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS selected_date    text,
  ADD COLUMN IF NOT EXISTS pickup_point_id  text,
  ADD COLUMN IF NOT EXISTS pickup_label     text;
