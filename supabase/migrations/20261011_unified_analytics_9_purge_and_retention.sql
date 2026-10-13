-- Unified customer analytics: two decisions by the owner, 2026-10-11.
--
--   1. "Yes to the purger." The Test-data purger (Growth ▸ Experiments) says it
--      removes every trace of a number. It left that number in the WhatsApp
--      message logs and in the booking history log. It now clears those too.
--   2. "Keep summaries for 12 months." The saved one-line-per-visit summaries
--      (analytics.visit_summary, analytics.visit_plan_steps) are deleted once
--      the visit is 12 months old.
--
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md

-- ── 1. The purger reaches the message logs and the history log ───────────────
--
-- purge_phone_data already calls analytics.purge_contact() (wired in by
-- 20261011_unified_analytics_2_evidence.sql), AFTER it has deleted the bookings.
-- That order matters here: deleting a booking writes a "deleted" line into
-- application_events, and those lines are then cleared with the rest.
--
-- ALL OR NOTHING. No error is swallowed in this function. If any table cannot
-- be cleared, the whole purge fails and nothing is deleted, and the person
-- running it sees why. A deletion tool that quietly skips a table is worse than
-- one that refuses.
--
-- application_events was built so that nothing could remove a line from it
-- (DELETE and TRUNCATE are revoked from every client role). This function is
-- the one sanctioned exception, and it is reachable only through
-- purge_phone_data: founders only, behind the passcode.
--
-- The two newest WhatsApp tables are cleared by name only if they exist, so
-- this keeps working if they are ever renamed away.
create or replace function analytics.purge_contact(p_phones text[])
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v jsonb := '{}'::jsonb;
  n integer;
begin
  delete from analytics.identity_evidence e where e.phone = any (p_phones);
  get diagnostics n = row_count;
  v := v || jsonb_build_object('tracking_lines', n);

  delete from public.open_event_otp_sessions o where o.phone = any (p_phones);
  get diagnostics n = row_count;
  v := v || jsonb_build_object('booking_code_rows', n);

  -- Delivery and read ticks are found through the message they belong to, so
  -- they go first.
  delete from public.whatsapp_send_events ev
  using public.whatsapp_sends s
  where ev.message_id is not null
    and ev.message_id = s.message_id
    and public.wa_normalise_phone(s.to_phone) = any (p_phones);
  get diagnostics n = row_count;
  v := v || jsonb_build_object('whatsapp_delivery_events', n);

  delete from public.whatsapp_sends s where public.wa_normalise_phone(s.to_phone) = any (p_phones);
  get diagnostics n = row_count;
  v := v || jsonb_build_object('whatsapp_messages_to_them', n);

  delete from public.whatsapp_inbound i where public.wa_normalise_phone(i.from_phone) = any (p_phones);
  get diagnostics n = row_count;
  v := v || jsonb_build_object('whatsapp_messages_from_them', n);

  if to_regclass('public.whatsapp_auto_replies') is not null then
    execute 'delete from public.whatsapp_auto_replies where public.wa_normalise_phone(phone) = any ($1)' using p_phones;
    get diagnostics n = row_count;
    v := v || jsonb_build_object('whatsapp_auto_reply_rows', n);
  end if;

  if to_regclass('public.whatsapp_cart_sessions') is not null then
    execute 'delete from public.whatsapp_cart_sessions where public.wa_normalise_phone(phone) = any ($1)' using p_phones;
    get diagnostics n = row_count;
    v := v || jsonb_build_object('whatsapp_cart_chat_rows', n);
  end if;

  delete from public.application_events h where public.wa_normalise_phone(h.phone) = any (p_phones);
  get diagnostics n = row_count;
  v := v || jsonb_build_object('booking_history_lines', n);

  return v;
end;
$fn$;

-- What the scan shows will be deleted. Same names as above, so the scan and the
-- result read alike.
create or replace function analytics.scan_contact(p_phones text[])
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v jsonb;
  n bigint;
begin
  v := jsonb_build_object(
    'tracking_lines',              (select count(*) from analytics.identity_evidence e where e.phone = any (p_phones)),
    'booking_code_rows',           (select count(*) from public.open_event_otp_sessions o where o.phone = any (p_phones)),
    'whatsapp_delivery_events',    (select count(*) from public.whatsapp_send_events ev
                                     join public.whatsapp_sends s on s.message_id = ev.message_id
                                    where ev.message_id is not null and public.wa_normalise_phone(s.to_phone) = any (p_phones)),
    'whatsapp_messages_to_them',   (select count(*) from public.whatsapp_sends s   where public.wa_normalise_phone(s.to_phone)   = any (p_phones)),
    'whatsapp_messages_from_them', (select count(*) from public.whatsapp_inbound i where public.wa_normalise_phone(i.from_phone) = any (p_phones)),
    -- Lines that exist now. The purge will also remove the "deleted" lines it
    -- creates itself when it deletes the bookings, so its own count is higher.
    'booking_history_lines',       (select count(*) from public.application_events h where public.wa_normalise_phone(h.phone) = any (p_phones))
  );
  if to_regclass('public.whatsapp_auto_replies') is not null then
    execute 'select count(*) from public.whatsapp_auto_replies where public.wa_normalise_phone(phone) = any ($1)' into n using p_phones;
    v := v || jsonb_build_object('whatsapp_auto_reply_rows', n);
  end if;
  if to_regclass('public.whatsapp_cart_sessions') is not null then
    execute 'select count(*) from public.whatsapp_cart_sessions where public.wa_normalise_phone(phone) = any ($1)' into n using p_phones;
    v := v || jsonb_build_object('whatsapp_cart_chat_rows', n);
  end if;
  return v;
end;
$fn$;

-- What a purge STILL does not remove, found while doing the above. Reported
-- beside the scan and never added to its total. Not changed here: nobody has
-- been asked.
--   * Email log rows. They hold an email address, not a number, and lose their
--     link to the booking when the booking is deleted, so they stay.
--   * The Meta audience list. A row here is also a membership uploaded to Meta;
--     removing it needs the matching removal on Meta's side.
create or replace function analytics.scan_kept_after_purge(p_phones text[])
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  select jsonb_build_object(
    'email_log_rows',
      (select count(*) from public.email_sends e join public.applications a on a.id = e.application_id
        where a.phone = any (p_phones)),
    'meta_audience_list_rows',
      (select count(*) from public.meta_audience_members m where public.wa_normalise_phone(m.phone) = any (p_phones))
  );
$fn$;

revoke all on function analytics.purge_contact(text[])         from public, anon, authenticated;
revoke all on function analytics.scan_contact(text[])          from public, anon, authenticated;
revoke all on function analytics.scan_kept_after_purge(text[]) from public, anon, authenticated;

-- ── 2. Visit summaries are kept for 12 months ────────────────────────────────
--
-- Raw website steps still go after 90 days (purge_flow_analytics, unchanged).
-- The one-line summary of each visit outlives them, and now goes when the visit
-- is 12 months old.
--
-- A stored evidence line ("this visit opened the link sent to this number")
-- only means something while the visit it names still exists, so those go at
-- 12 months as well. Nothing else is touched: bookings, payments and messages
-- keep whatever lifetime they already had.
create or replace function analytics.purge_old_visits()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_before  timestamptz := now() - interval '12 months';
  v_plans   integer;
  v_lines   integer;
  v_visits  integer;
begin
  delete from analytics.visit_plan_steps ps
  using analytics.visit_summary vs
  where vs.session_id = ps.session_id and vs.started_at < v_before;
  get diagnostics v_plans = row_count;

  delete from analytics.identity_evidence e where e.observed_at < v_before;
  get diagnostics v_lines = row_count;

  delete from analytics.visit_summary vs where vs.started_at < v_before;
  get diagnostics v_visits = row_count;

  return jsonb_build_object('visits', v_visits, 'visit_plans', v_plans, 'evidence_lines', v_lines, 'older_than', v_before);
end;
$fn$;

revoke all on function analytics.purge_old_visits() from public, anon, authenticated;

comment on table analytics.visit_summary is
  'One row per website visit, rebuilt nightly by analytics.refresh_visits() BEFORE purge_flow_analytics clears steps older than 90 days. This is the purge-proof record of a visit, as analytics_daily is of a day. steps = {step name: first time it happened}. It holds no phone number: whose visit it was is worked out by analytics.v_visit_resolved from the evidence. KEPT 12 MONTHS (owner, 2026-10-11): analytics.purge_old_visits(), nightly.';

-- 03:25 UTC: after the 90-day clean-up (03:17), before the health snapshot (03:30).
select cron.unschedule('analytics-purge-old-visits')
  where exists (select 1 from cron.job where jobname = 'analytics-purge-old-visits');
select cron.schedule('analytics-purge-old-visits', '25 3 * * *', $$select analytics.purge_old_visits()$$);
