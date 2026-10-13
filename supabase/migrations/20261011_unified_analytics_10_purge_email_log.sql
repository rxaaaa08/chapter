-- Owner, 2026-10-11: "Just remove the email log. I don't want to mess up the
-- customer data we send to Meta, so don't touch that."
--
-- So the Test-data purger (Growth ▸ Experiments) now also clears a number's
-- email log rows and their delivery events.
--
-- THE META AUDIENCE LIST IS LEFT ALONE, ON HIS INSTRUCTION. Do not add
-- meta_audience_members to any purge: a row there is also a membership we have
-- uploaded to Meta, and removing one side without the other corrupts the
-- customer data Meta holds for us. It stays listed under kept_after_purge so
-- nobody mistakes its presence for an oversight.
--
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md

-- ── Which email log rows belong to these numbers ─────────────────────────────
--
-- An email log row holds an address, not a number. It is tied to a number in
-- one of three ways, tried in this order:
--   1. it belongs to one of the number's bookings        (application_id)
--   2. it belongs to one of the number's bill opens      (bill_open_id)
--   3. it belongs to neither (its booking was deleted earlier, which blanks the
--      link) AND it went to an address that ONLY these numbers have ever used.
--
-- Rule 3 is deliberately narrow. Five addresses are known to have been used
-- with two different numbers (measured 2026-10-11). When an address is also
-- used by a number that is NOT being purged, its unlinked rows cannot be told
-- apart, so they are KEPT, and the scan says how many. Leaving a test row
-- behind is a smaller mistake than deleting a customer's.
create or replace function analytics.contact_email_rows(p_phones text[])
returns table (id bigint, message_id text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  with mine as (
    select lower(a.email) as em from public.applications a
     where a.phone = any (p_phones) and nullif(a.email, '') is not null
    union
    select lower(p.email) from public.payu_payments p
     where p.phone = any (p_phones) and nullif(p.email, '') is not null
    union
    select lower(d.email) from public.doubt_submissions d
     where public.wa_normalise_phone(d.phone) = any (p_phones) and nullif(d.email, '') is not null
    union
    select lower(o.email) from public.open_event_otp_sessions o
     where o.phone = any (p_phones) and nullif(o.email, '') is not null
  ),
  others as (
    select lower(a.email) as em from public.applications a
     where not (a.phone = any (p_phones)) and nullif(a.email, '') is not null
    union
    select lower(p.email) from public.payu_payments p
     where not (p.phone = any (p_phones)) and nullif(p.email, '') is not null
    union
    select lower(d.email) from public.doubt_submissions d
     where not (public.wa_normalise_phone(d.phone) = any (p_phones)) and nullif(d.email, '') is not null
    union
    select lower(o.email) from public.open_event_otp_sessions o
     where not (o.phone = any (p_phones)) and nullif(o.email, '') is not null
  ),
  only_mine as (select em from mine except select em from others)
  select e.id, e.message_id
  from public.email_sends e
  where e.application_id in (select a.id from public.applications a where a.phone = any (p_phones))
     or e.bill_open_id   in (select b.id from public.bill_opens b   where b.phone = any (p_phones))
     or (e.application_id is null and e.bill_open_id is null
         and lower(e.to_email) in (select em from only_mine));
$fn$;

-- Runs FIRST in purge_phone_data, before any booking is deleted: deleting a
-- booking blanks the link on its email rows, and after that rule 1 above could
-- no longer find them.
create or replace function analytics.purge_contact_emails(p_phones text[])
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_rows   integer;
  v_events integer;
begin
  with mine as materialized (
    select r.id, r.message_id from analytics.contact_email_rows(p_phones) r
  ),
  ev as (
    delete from public.email_send_events x
    where x.message_id is not null
      and x.message_id in (select m.message_id from mine m where m.message_id is not null)
    returning 1
  ),
  es as (
    delete from public.email_sends e
    where e.id in (select m.id from mine m)
    returning 1
  )
  select (select count(*) from es), (select count(*) from ev) into v_rows, v_events;

  return jsonb_build_object('email_log_rows', v_rows, 'email_delivery_events', v_events);
end;
$fn$;

-- The scan: same names, same rule, so what it promises is what the purge does.
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
    'booking_history_lines',       (select count(*) from public.application_events h where public.wa_normalise_phone(h.phone) = any (p_phones)),
    'email_log_rows',              (select count(*) from analytics.contact_email_rows(p_phones)),
    'email_delivery_events',       (select count(*) from public.email_send_events x
                                    where x.message_id is not null
                                      and x.message_id in (select r.message_id from analytics.contact_email_rows(p_phones) r
                                                           where r.message_id is not null))
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

-- What a purge still leaves, and why.
create or replace function analytics.scan_kept_after_purge(p_phones text[])
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  with mine as (
    select lower(a.email) as em from public.applications a
     where a.phone = any (p_phones) and nullif(a.email, '') is not null
    union
    select lower(p.email) from public.payu_payments p
     where p.phone = any (p_phones) and nullif(p.email, '') is not null
    union
    select lower(d.email) from public.doubt_submissions d
     where public.wa_normalise_phone(d.phone) = any (p_phones) and nullif(d.email, '') is not null
    union
    select lower(o.email) from public.open_event_otp_sessions o
     where o.phone = any (p_phones) and nullif(o.email, '') is not null
  )
  select jsonb_build_object(
    -- Left alone on the owner's instruction (2026-10-11). Not an oversight.
    'meta_audience_list_rows',
      (select count(*) from public.meta_audience_members m where public.wa_normalise_phone(m.phone) = any (p_phones)),
    -- Unlinked email rows to an address these numbers used, which a number NOT
    -- being purged has also used. They cannot be told apart, so they stay.
    'email_log_rows_at_an_address_another_number_also_uses',
      (select count(*) from public.email_sends e
        where e.application_id is null and e.bill_open_id is null
          and lower(e.to_email) in (select em from mine)
          and e.id not in (select r.id from analytics.contact_email_rows(p_phones) r))
  );
$fn$;

revoke all on function analytics.contact_email_rows(text[])    from public, anon, authenticated;
revoke all on function analytics.purge_contact_emails(text[])  from public, anon, authenticated;
revoke all on function analytics.scan_contact(text[])          from public, anon, authenticated;
revoke all on function analytics.scan_kept_after_purge(text[]) from public, anon, authenticated;

-- Wire the early step into purge_phone_data: one call, placed before its first
-- DELETE. Checked: if the insertion point is not found, this migration fails
-- instead of leaving the purge silently incomplete.
do $do$
declare
  d  text;
  d2 text;
begin
  select pg_get_functiondef('public.purge_phone_data(text[], text)'::regprocedure) into d;
  if position('analytics.purge_contact_emails' in d) = 0 then
    d2 := regexp_replace(
      d,
      'DELETE\s+FROM\s+marketer_sales\s+ms',
      E'v_counts := v_counts || analytics.purge_contact_emails(v_valid);\n  DELETE FROM marketer_sales ms'
    );
    if d2 = d then
      raise exception 'purge_phone_data: anchor not found, email purge NOT wired in';
    end if;
    execute d2;
  end if;
end;
$do$;
