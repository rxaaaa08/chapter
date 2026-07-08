-- Brevo email engagement tracking.
-- Stamped by the brevo-webhook Edge Function when Brevo reports that an
-- invite/recovery email was opened or unsubscribed. The app keeps
-- applications.status = 'invited' and derives admin display labels from these
-- columns.

alter table public.applications
  add column if not exists email_opened_at timestamptz;

alter table public.applications
  add column if not exists email_unsubscribed_at timestamptz;

alter table public.applications
  add column if not exists cart_abandon_email_opened_at timestamptz;

alter table public.applications
  add column if not exists resend_details_email_sent_at timestamptz;

alter table public.applications
  add column if not exists resend_details_link_clicked_at timestamptz;

create index if not exists idx_applications_email_opened_lookup
  on public.applications (lower(email), status, email_invite_sent, email_invite_sent_at desc)
  where email is not null;
