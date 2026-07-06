-- Track whether the Brevo email invite was sent for an application, mirroring
-- aisensy_invite_sent / invite_sent_at. Chapter (non-galcode) events collect an
-- email on the application form; on approval we now send an email invite in
-- addition to the WhatsApp invite. These columns let the People tab show the
-- email status and let approveApplication avoid re-sending needlessly.
alter table public.applications
  add column if not exists email_invite_sent boolean not null default false,
  add column if not exists email_invite_sent_at timestamptz;
