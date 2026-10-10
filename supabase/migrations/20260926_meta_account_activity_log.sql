-- The ad account's own change log, recorded daily (cloud audit OPP-7, 2026-09-26)
-- =============================================================================
-- WHY. Our delivery-settings history (20260917) records WHEN OUR DAILY SYNC
-- NOTICED a change — not when it happened, and not who made it. Meta's account
-- activity log (GET act_<id>/activities, the Ads Manager "history" page) has
-- both, and it also shows changes META made by itself, which matters given the
-- standing rule never to auto-apply Meta's suggestions (M11): a change nobody
-- here made is exactly the thing to see.
--
-- Measured 2026-09-26 through the Meta Ads MCP: the log reaches back to
-- 2026-08-12 (the first ₹500 top-up, actor "Meta"), and holds the founder's own
-- edits ("Chapter A." via the ads MCP server / Power Editor), the reporting
-- system user's daily audience uploads ("chaptera-reporting" via chaptera-ads),
-- and Meta's billing entries. The report's "lost after a week" worry did not
-- hold — one week is only the endpoint's DEFAULT window.
--
-- PRIVACY. Each entry's extra_data carries the caller's IP address, machine
-- cookie, TLS/HTTP fingerprints and request ids. None of that answers "what
-- changed", so it is stripped in SQL before anything is stored.
--
-- NO PUSH, by the owner's standing choice for delivery history ("show it on the
-- page, no alerts", memory meta-delivery-settings-history). Page only.

create table if not exists public.meta_account_activity (
  id                    bigint generated always as identity primary key,
  -- Meta gives no id per entry. This key is what makes a re-read of an
  -- overlapping window insert nothing twice.
  activity_key          text not null unique,
  event_time            timestamptz not null,
  event_type            text,
  translated_event_type text,
  actor_id              text,
  actor_name            text,
  application_name      text,
  object_id             text,
  object_name           text,
  object_type           text,
  extra                 jsonb,          -- scrubbed; see meta_scrub_activity_extra()
  first_seen_at         timestamptz not null default now()
);

create index if not exists meta_account_activity_time on public.meta_account_activity (event_time desc);

comment on table public.meta_account_activity is
  'Meta ad account activity log (who changed what, incl. Meta itself), read daily '
  'by meta-ads-sync. extra has IPs/cookies/fingerprints removed. Page only, no push.';

alter table public.meta_account_activity enable row level security;
revoke all on public.meta_account_activity from anon, authenticated;

-- What is dropped from extra_data. Everything identifying a machine or a
-- request; everything describing the change (old_value, new_value, type,
-- amount, currency, operation, received_users …) is kept.
create or replace function public.meta_scrub_activity_extra(p_extra jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select case when jsonb_typeof(p_extra) = 'object'
    then p_extra - array['ip','server_ip','machine_cookie','ssl_fp','http_fp','session_id',
                         'svn_version','debug_identifier','parent_request_id','root_request_id',
                         'www_request_id']
    else p_extra end;
$$;

revoke all on function public.meta_scrub_activity_extra(jsonb) from public, anon, authenticated;
grant execute on function public.meta_scrub_activity_extra(jsonb) to service_role;

-- p_rows: Meta's `data` array as returned. extra_data arrives as a JSON STRING
-- (measured); a string that is not JSON is kept as text rather than failing the row.
create or replace function public.record_meta_account_activity(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_row      jsonb;
  v_extra    jsonb;
  v_time     timestamptz;
  v_inserted int := 0;
  v_received int := 0;
  v_n        int;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return jsonb_build_object('received', 0, 'inserted', 0);
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_received := v_received + 1;
    begin
      v_time := (v_row ->> 'event_time')::timestamptz;
    exception when others then
      v_time := null;
    end;
    continue when v_time is null;

    begin
      v_extra := case jsonb_typeof(v_row -> 'extra_data')
                   when 'string' then (v_row ->> 'extra_data')::jsonb
                   else v_row -> 'extra_data'
                 end;
    exception when others then
      v_extra := to_jsonb(v_row ->> 'extra_data');
    end;

    insert into public.meta_account_activity (
      activity_key, event_time, event_type, translated_event_type,
      actor_id, actor_name, application_name, object_id, object_name, object_type, extra
    ) values (
      md5(concat_ws('|', v_time::text, v_row ->> 'event_type', v_row ->> 'object_id',
                    v_row ->> 'actor_id', public.meta_scrub_activity_extra(v_extra)::text)),
      v_time,
      v_row ->> 'event_type',
      v_row ->> 'translated_event_type',
      v_row ->> 'actor_id',
      v_row ->> 'actor_name',
      v_row ->> 'application_name',
      v_row ->> 'object_id',
      v_row ->> 'object_name',
      v_row ->> 'object_type',
      public.meta_scrub_activity_extra(v_extra)
    )
    on conflict (activity_key) do nothing;
    get diagnostics v_n = row_count;
    v_inserted := v_inserted + v_n;
  end loop;

  return jsonb_build_object('received', v_received, 'inserted', v_inserted);
end;
$function$;

revoke all on function public.record_meta_account_activity(jsonb) from public, anon, authenticated;
grant execute on function public.record_meta_account_activity(jsonb) to service_role;

-- Founder-gated reader for Growth ▸ Ads. `by_meta` marks entries whose actor is
-- Meta itself (actor_id 0 / name "Meta"): the ones nobody here made.
create or replace function public.get_meta_account_activity(p_limit integer default 40)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin_strict() then jsonb_build_object(
    'capture_since', (select min(first_seen_at) from public.meta_account_activity),
    'oldest_entry',  (select min(event_time) from public.meta_account_activity),
    'entries', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.event_time desc)
      from (
        select a.event_time, a.event_type, a.translated_event_type, a.actor_name,
               a.application_name, a.object_id, a.object_name, a.object_type, a.extra,
               (a.actor_id = '0' or a.actor_name = 'Meta') as by_meta
        from public.meta_account_activity a
        order by a.event_time desc
        limit greatest(1, least(coalesce(p_limit, 40), 200))
      ) x
    ), '[]'::jsonb)
  ) end;
$$;

revoke all on function public.get_meta_account_activity(integer) from public, anon, authenticated;
grant execute on function public.get_meta_account_activity(integer) to authenticated;
