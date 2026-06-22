-- Capture intent ("Why do you want to join us?") alongside the doubt so a call
-- marketer can both resolve the doubt and invite the person without a re-apply.
alter table public.doubt_submissions add column if not exists why_join text;
