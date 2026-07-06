-- Independent send-flag for the cart-abandonment EMAIL (Brevo), separate from
-- cart_abandonment_sent (which tracks the WhatsApp). Invite-only chapter events
-- collect an applicant email; the cart-abandonment cron now emails them too.
-- Keeping a distinct flag means a WhatsApp retry (row still cart_abandonment_sent
-- = false) can't re-send the email, and vice-versa.
alter table public.bill_opens
  add column if not exists cart_abandon_email_sent boolean not null default false;
