CREATE TABLE IF NOT EXISTS invited_numbers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_slug, phone)
);
