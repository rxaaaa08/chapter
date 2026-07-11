alter table public.applications
  add column if not exists resend_details_whatsapp_sent_at timestamptz;
