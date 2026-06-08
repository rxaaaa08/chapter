-- Collect the applicant's email at application time (booking-application flow,
-- step 1). Used to (a) keep a real contact email on file and (b) pre-fill +
-- lock the email on the payment bill so applicants don't retype it and can't
-- change it at pay time. Nullable — older rows and bulk-invited people simply
-- have no email and enter it on the bill instead.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS email text;
