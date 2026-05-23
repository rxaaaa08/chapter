-- Add per-city content to events
-- city_details is a JSONB map keyed by city name, each value holds:
--   included[], not_included[], optional_activities[], itinerary[]
-- When a plan has multiple cities (e.g. Chennai + Delhi) each city can
-- have its own inclusions and day-by-day itinerary stored here.
-- Single-city plans continue to use the flat included/itinerary columns.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS city_details jsonb DEFAULT '{}'::jsonb;
