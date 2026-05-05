CREATE TABLE IF NOT EXISTS invite_payment_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_slug text NOT NULL,
  event_id uuid,
  event_slug text,
  event_title text NOT NULL,
  selected_date text,
  name text NOT NULL,
  phone text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending_manual_verification',
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invite_payment_submissions_invite_slug_idx
  ON invite_payment_submissions(invite_slug);

CREATE INDEX IF NOT EXISTS invite_payment_submissions_submitted_at_idx
  ON invite_payment_submissions(submitted_at DESC);

ALTER TABLE invite_payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit invite payment handoffs" ON invite_payment_submissions;
CREATE POLICY "Public can submit invite payment handoffs"
  ON invite_payment_submissions
  FOR INSERT
  TO anon
  WITH CHECK (
    length(trim(name)) > 0
    AND phone ~ '^[0-9]{10}$'
    AND amount > 0
  );

DROP POLICY IF EXISTS "Public can read invite payment handoffs for admin" ON invite_payment_submissions;
CREATE POLICY "Public can read invite payment handoffs for admin"
  ON invite_payment_submissions
  FOR SELECT
  TO anon
  USING (true);
