-- Track the Brevo payment-failure email independently from the AiSensy
-- WhatsApp flag so callback/webhook/reconcile cannot double-send it.

alter table public.applications
  add column if not exists payment_failed_email_sent boolean not null default false,
  add column if not exists payment_failed_email_sent_at timestamptz;
