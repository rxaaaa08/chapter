CREATE TABLE IF NOT EXISTS invite_payment_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_slug text NOT NULL,
  event_id text,
  event_slug text,
  event_title text,
  selected_date text,
  name text NOT NULL,
  phone text NOT NULL,
  amount numeric,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invite_payment_submissions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON invite_payment_submissions TO anon, authenticated;
