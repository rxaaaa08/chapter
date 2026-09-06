-- Phase 5a of the delivery-logging handoff: move the pre-cutover email history
-- into email_sends before the legacy columns are dropped.
--
-- Every row here is stamped backfilled = true, and that flag is not decoration.
-- These rows were reconstructed from one-off boolean/timestamp columns, so:
--
--   * none of them has a message_id -- it was never stored -- which means they
--     can never receive a late callback and can never be joined back to Brevo.
--     They are closed records by construction.
--   * delivered_at is null for all of them. The old webhook never listened for
--     Brevo's delivery events, so that rung genuinely has no data behind it.
--     Left null rather than inferred from an open.
--   * the nudge rows carry NO send timestamp of their own. bill_opens only ever
--     recorded a bare boolean, so sent_at is the BILL OPEN time; the actual
--     nudge went out 1-2 hours later and that moment was never written down.
--     The date is right, the time is early, and backfilled = true is how anyone
--     reading it later knows to distrust the minute.
--
-- Same honesty rule as the field='baseline' rows in application_events: a
-- reconstruction must never be mistakable for an observation.
--
-- Idempotent: every insert is guarded by the same unique indexes the live claim
-- path uses, so re-running this changes nothing.

-- ── Invite emails ───────────────────────────────────────────────────────────
insert into public.email_sends
  (kind, to_email, application_id, sent_at, opened_at, send_ok, backfilled, subject)
select 'invite', btrim(a.email), a.id, a.email_invite_sent_at, a.email_opened_at,
       true, true, 'Invite'
from public.applications a
where a.email_invite_sent = true
  and coalesce(btrim(a.email), '') <> ''
on conflict do nothing;

-- ── Details resends ─────────────────────────────────────────────────────────
-- Opens were deliberately never recorded for this one: the product definition of
-- engagement here is a link click, so the old webhook skipped pixel opens. That
-- is why opened_at stays null while clicked_at is carried across.
insert into public.email_sends
  (kind, to_email, application_id, sent_at, clicked_at, send_ok, backfilled, subject)
select 'details', btrim(a.email), a.id, a.resend_details_email_sent_at,
       a.resend_details_link_clicked_at, true, true, 'Details'
from public.applications a
where a.resend_details_email_sent_at is not null
  and coalesce(btrim(a.email), '') <> ''
on conflict do nothing;

-- ── Payment-failure retries ─────────────────────────────────────────────────
-- Never had any tracking at all: the tag was not in the webhook's allow-list, so
-- every open and bounce Brevo sent for these was received and discarded.
insert into public.email_sends
  (kind, to_email, application_id, sent_at, send_ok, backfilled, subject)
select 'retry', btrim(a.email), a.id, a.payment_failed_email_sent_at,
       true, true, 'Payment failed'
from public.applications a
where a.payment_failed_email_sent = true
  and coalesce(btrim(a.email), '') <> ''
on conflict do nothing;

-- ── Cart-abandonment nudges ─────────────────────────────────────────────────
-- Keyed to the bill open, matching the live claim path. The application link and
-- the open timestamp are recovered by phone + event_slug, and only the newest
-- bill open for a lead inherits the open: applications carries one
-- cart_abandon_email_opened_at no matter how many times someone abandoned, so
-- spreading it across every bill open would invent engagement that never
-- happened.
insert into public.email_sends
  (kind, to_email, application_id, bill_open_id, sent_at, opened_at, send_ok, backfilled, subject)
select distinct on (b.id)
       'nudge',
       btrim(a.email),
       a.id,
       b.id,
       b.opened_at,
       case when b.id = newest.bill_open_id then a.cart_abandon_email_opened_at end,
       true, true, 'Cart abandonment'
from public.bill_opens b
join public.applications a
  on a.phone = b.phone
 and a.event_slug = b.event_slug
left join lateral (
  select b2.id as bill_open_id
  from public.bill_opens b2
  where b2.phone = b.phone and b2.event_slug = b.event_slug
    and b2.cart_abandon_email_sent = true
  order by b2.opened_at desc nulls last
  limit 1
) newest on true
where b.cart_abandon_email_sent = true
  and coalesce(btrim(a.email), '') <> ''
on conflict do nothing;
