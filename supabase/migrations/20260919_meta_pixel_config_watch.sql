-- Meta signal watchdog, check 7: what has Meta told the website Pixel to do?
--
-- WHY THIS EXISTS
-- Every browser event leaves the site through fbevents.js, and fbevents obeys a
-- per-Pixel settings file Meta serves publicly at
--   https://connect.facebook.net/signals/config/<pixel_id>
-- (the Meta Pixel docs' Content Security Policy section names this path). That
-- file can tell the browser, with no warning anywhere we look, to:
--   * DROP an event outright         eventValidation.restrictedEventNames /
--                                    unverifiedEventNames  (Meta's code logs
--                                    "RESTRICTED_EVENT" and sends nothing)
--   * DELETE a parameter from events unwantedData.blacklisted_keys[event].cd,
--                                    and sensitive_keys (key names as sha256)
--   * SWITCH THE PIXEL OFF on a site prohibitedSources (sha256 of the hostname)
--   * put the Pixel in restricted-data mode (the ProtectedDataMode feature)
-- This is the same integrity system that since 2 Sep 2025 flags custom
-- conversions "suggesting information not permitted" (the Conversion Tracking
-- doc). For a business that has proposed a 1:1 dating test, being classified
-- into a sensitive category is a real possibility, not a theoretical one.
--
-- The count checks (view_content_web / add_to_cart_web) would notice a dropped
-- event after ~3 days of data. They can NEVER notice a stripped parameter: the
-- event still arrives, just without content_ids (per-plan audiences die) or
-- value (Meta's ROAS dies). Reading the rules themselves catches both on the
-- day they change, before any data is lost to them.
--
-- WHAT IT COSTS: one anonymous GET of a public CDN file per day. No token, no
-- Graph quota, no event sent. It reads exactly what a visitor's browser reads.
--
-- MEASURED 2026-09-19, the first reading:
--   * restricted / unverified events: none.  stripped keys: none.
--     prohibited sources: none.  ProtectedDataMode: off.
--   * InferredEvents ON (the source of the junk SubscribedButtonClick) and
--     AutomaticMatching NOT opted in at all — which is what showed that turning
--     automatic setup off in src/metaPixel.ts costs nothing (handoff §23).
--   * The file depends on fbevents' version: v=2.9.200 served 17 features,
--     current serves 26. The function fetches with no version, which serves
--     what live browsers get today.
--   * An unknown Pixel id is served a 30 KB file whose plugin is literally
--     "/* empty plugin */" — that is how "Meta no longer knows this Pixel" reads.

-- ---------------------------------------------------------------------------
-- 1. The check row.
-- ---------------------------------------------------------------------------
alter table public.meta_signal_watch drop constraint if exists meta_signal_watch_check_key_check;
alter table public.meta_signal_watch add constraint meta_signal_watch_check_key_check check (check_key in (
  'capi_token', 'capi_test_mode',
  'purchase_server', 'lead_server',
  'view_content_web', 'add_to_cart_web',
  'pixel_config'
));

insert into public.meta_signal_watch (check_key, label, kind, sort_order, cooldown_hours, push_enabled)
values ('pixel_config', 'What Meta lets the Pixel send', 'probe', 70, 12, false)
on conflict (check_key) do nothing;
-- push_enabled starts FALSE, the house rule for every new check: it records for
-- real before it is trusted to wake a phone. Switched on by a separate UPDATE.

-- ---------------------------------------------------------------------------
-- 2. The verdict — pure, so it can be tested against made-up settings files.
-- ---------------------------------------------------------------------------
-- p_facts is what meta-signal-watchdog extracted from the file (see
-- readPixelConfig there). p_prev is the detail of the last readable run, used
-- only to notice that a feature we care about changed.
create or replace function public.meta_pixel_config_verdict(
  p_facts jsonb,
  p_prev  jsonb default null,
  p_now   timestamptz default now()
) returns jsonb
language plpgsql
-- STABLE, not IMMUTABLE: casting a stored timestamp string and formatting it
-- for IST both read the session time zone.
stable
set search_path = public
as $$
declare
  -- What the site actually sends. MUST mirror PIXEL_EVENTS in src/supabase.ts
  -- (plus the Purchase fired by trackPurchaseOnce) and the PixelParams keys in
  -- src/metaPixel.ts. A key missing here is a key whose stripping reads as
  -- "someone else's problem" (gap) instead of ours (broken).
  c_events  constant text[] := array['PageView','ViewContent','AddToCart','ReachedPricing',
                                     'InitiateCheckout','Lead','Purchase'];
  c_keys    constant text[] := array['content_name','content_ids','content_category','content_type',
                                     'city','cta_type','value','currency','order_id'];
  c_hosts   constant text[] := array['chaptera.in','www.chaptera.in'];
  -- Features whose switching on or off changes what Meta collects or infers
  -- from the site. Only these count as a change worth showing: Meta adds and
  -- retires plumbing features (Timezone, BotBlocking, ...) with every fbevents
  -- release, and flagging those would teach everyone to ignore the card.
  c_watched constant text[] := array['AutomaticMatching','AutomaticMatchingRegex','AutomaticMatchingAI',
                                     'InferredEvents','SmartSetup','SmartSetupTotalPriceExtraction',
                                     'SmartSetupSelfSupervisedRule','AutomaticParameters','Microdata',
                                     'MicrodataCoverage','MicrodataFieldTransmission','PageMetadata',
                                     'ProtectedDataMode','FirstPartyCookies'];
  v_features   text[];
  v_watched_on text[];
  v_prev_on    text[];
  v_added      text[];
  v_removed    text[];
  v_last_change jsonb;
  v_blocked    text[];
  v_other_evts text[];
  v_ours       jsonb := '[]'::jsonb;   -- [{event, key, how}] on things we send
  v_other      jsonb := '[]'::jsonb;   -- the same, on things we do not send
  v_url        jsonb := '[]'::jsonb;   -- URL parameters Meta rewrites to _removed_
  v_prohibited boolean := false;
  v_broken     text[] := '{}';
  v_gap        text[] := '{}';
  v_reason     text;
  ev text; spec jsonb; k text; h text; hit text;
begin
  -- Could not look: say so, never guess "fine".
  v_reason := case
    when p_facts is null or coalesce((p_facts->>'fetched')::boolean, false) = false
      then 'could not fetch Meta''s settings for the Pixel' || coalesce(' (' || (p_facts->>'error') || ')', '')
    when coalesce((p_facts->>'section_found')::boolean, false) = false
      then 'Meta''s settings file had no section for this Pixel'
    when coalesce((p_facts->>'empty_plugin')::boolean, false)
      then 'Meta served an empty settings file for this Pixel — it may no longer recognise it'
    when jsonb_typeof(p_facts->'parse_errors') = 'array' and jsonb_array_length(p_facts->'parse_errors') > 0
      then 'Meta changed the format of its settings file: ' || (p_facts->'parse_errors'->>0)
  end;
  if v_reason is not null then
    return jsonb_build_object('verdict', 'unreadable',
      'detail', jsonb_build_object('reason', v_reason, 'summary', 'Could not read — ' || v_reason,
                                   'http_status', p_facts->'http_status', 'bytes', p_facts->'bytes'));
  end if;

  v_features := array(select distinct x from jsonb_array_elements_text(coalesce(p_facts->'features', '[]')) x order by 1);
  v_watched_on := array(select x from unnest(v_features) x where x = any(c_watched) order by 1);

  -- Events Meta refuses to send.
  v_blocked := array(
    select distinct x from jsonb_array_elements_text(
      coalesce(p_facts->'restricted_events', '[]') || coalesce(p_facts->'unverified_events', '[]')) x
    where x = any(c_events) order by 1);
  v_other_evts := array(
    select distinct x from jsonb_array_elements_text(
      coalesce(p_facts->'restricted_events', '[]') || coalesce(p_facts->'unverified_events', '[]')) x
    where not (x = any(c_events)) order by 1);
  if cardinality(v_blocked) > 0 then
    v_broken := array_append(v_broken, ('Meta blocks ' || array_to_string(v_blocked, ', ') || ' from the Pixel')::text);
  end if;
  if cardinality(v_other_evts) > 0 then
    v_gap := array_append(v_gap, ('Meta restricts events we do not send: ' || array_to_string(v_other_evts, ', '))::text);
  end if;

  -- Parameters deleted by name.
  if jsonb_typeof(p_facts->'blacklisted_keys') = 'object' then
    for ev, spec in select * from jsonb_each(p_facts->'blacklisted_keys') loop
      for k in select jsonb_array_elements_text(coalesce(spec->'cd', '[]')) loop
        if ev = any(c_events) and k = any(c_keys) then
          v_ours := v_ours || jsonb_build_object('event', ev, 'key', k, 'how', 'removed');
        else
          v_other := v_other || jsonb_build_object('event', ev, 'key', k, 'how', 'removed');
        end if;
      end loop;
      for k in select jsonb_array_elements_text(coalesce(spec->'url', '[]')) loop
        v_url := v_url || jsonb_build_object('event', ev, 'param', k);
      end loop;
    end loop;
  end if;

  -- Parameters deleted as "sensitive": Meta lists sha256 of the key NAME, and
  -- fbevents hashes each key it sends to compare. Do the same with ours.
  if jsonb_typeof(p_facts->'sensitive_keys') = 'object' then
    for ev, spec in select * from jsonb_each(p_facts->'sensitive_keys') loop
      for h in select lower(jsonb_array_elements_text(coalesce(spec->'cd', '[]'))) loop
        select key into hit from unnest(c_keys) key
         where encode(sha256(convert_to(key, 'UTF8')), 'hex') = h limit 1;
        if ev = any(c_events) and hit is not null then
          v_ours := v_ours || jsonb_build_object('event', ev, 'key', hit, 'how', 'removed as sensitive');
        else
          v_other := v_other || jsonb_build_object('event', ev, 'key', coalesce(hit, 'sha256:' || left(h, 12)),
                                                   'how', 'removed as sensitive');
        end if;
      end loop;
      for h in select jsonb_array_elements_text(coalesce(spec->'url', '[]')) loop
        v_url := v_url || jsonb_build_object('event', ev, 'param', 'sha256:' || left(h, 12));
      end loop;
    end loop;
  end if;

  if jsonb_array_length(v_ours) > 0 then
    v_broken := array_append(v_broken, ('Meta strips ' || (
      select string_agg(distinct (o->>'key') || ' from ' || (o->>'event'), ', ')
      from jsonb_array_elements(v_ours) o))::text);
  end if;
  if jsonb_array_length(v_other) > 0 then
    v_gap := array_append(v_gap, ('Meta strips parameters we do not send (' || jsonb_array_length(v_other) || ')')::text);
  end if;
  if jsonb_array_length(v_url) > 0 then
    -- Our own spend↔booking join reads the landing URL in the browser, not
    -- Meta's copy of it, so this cannot break attribution. Worth seeing, not
    -- worth a phone call.
    v_gap := array_append(v_gap, ('Meta blanks ' || jsonb_array_length(v_url) || ' URL parameter(s) in its copy of page addresses')::text);
  end if;

  -- The Pixel switched off on our own domain.
  select exists (
    select 1 from jsonb_array_elements(coalesce(p_facts->'prohibited_sources', '[]')) s
    where lower(s->>'domain') in (select encode(sha256(convert_to(x, 'UTF8')), 'hex') from unnest(c_hosts) x)
  ) into v_prohibited;
  if v_prohibited then
    v_broken := array_append(v_broken, 'Meta has switched the Pixel off on chaptera.in'::text);
  end if;

  if 'ProtectedDataMode' = any(v_features) then
    v_broken := array_append(v_broken, 'Meta has put the Pixel in restricted-data mode'::text);
  end if;

  -- A watched feature switched on or off since the last readable run. Shown
  -- for a week, then it is simply the current state. The first run has no
  -- baseline, so it records one rather than calling everything a change.
  v_last_change := p_prev->'last_change';
  if p_prev ? 'watched_on' then
    v_prev_on := array(select jsonb_array_elements_text(p_prev->'watched_on'));
    v_added   := array(select x from unnest(v_watched_on) x where not (x = any(v_prev_on)) order by 1);
    v_removed := array(select x from unnest(v_prev_on) x where not (x = any(v_watched_on)) order by 1);
    if cardinality(v_added) + cardinality(v_removed) > 0 then
      v_last_change := jsonb_build_object('at', p_now, 'added', to_jsonb(v_added), 'removed', to_jsonb(v_removed));
    end if;
  end if;
  if v_last_change is not null and (v_last_change->>'at')::timestamptz > p_now - interval '7 days' then
    v_gap := array_append(v_gap, ('Meta changed Pixel settings on ' || to_char((v_last_change->>'at')::timestamptz at time zone 'Asia/Kolkata', 'DD Mon') || ':'
      || coalesce(' on ' || nullif(array_to_string(array(select jsonb_array_elements_text(v_last_change->'added')), ', '), ''), '')
      || coalesce(' off ' || nullif(array_to_string(array(select jsonb_array_elements_text(v_last_change->'removed')), ', '), ''), ''))::text);
  end if;

  return jsonb_build_object(
    'verdict', case when cardinality(v_broken) > 0 then 'broken' when cardinality(v_gap) > 0 then 'gap' else 'ok' end,
    'detail', jsonb_build_object(
      'summary', case
        when cardinality(v_broken) > 0 then array_to_string(v_broken, '; ')
        when cardinality(v_gap) > 0 then array_to_string(v_gap, '; ')
        else 'Meta blocks nothing and strips nothing we send' end,
      'reasons', to_jsonb(v_broken || v_gap),
      'blocked_events', to_jsonb(v_blocked),
      'stripped', v_ours,
      'stripped_other', v_other,
      'url_params_blanked', v_url,
      'prohibited_on_our_domain', v_prohibited,
      'features', to_jsonb(v_features),
      'watched_on', to_jsonb(v_watched_on),
      'last_change', v_last_change,
      'http_status', p_facts->'http_status',
      'bytes', p_facts->'bytes'
    )
  );
end;
$$;

comment on function public.meta_pixel_config_verdict(jsonb, jsonb, timestamptz) is
  'Pure verdict for the pixel_config watchdog check: does Meta''s public settings file for the '
  'Pixel block, strip or switch off anything the site sends? Testable with made-up facts.';

-- ---------------------------------------------------------------------------
-- 3. The evaluator the watchdog calls: the verdict plus the last readable run.
-- ---------------------------------------------------------------------------
create or replace function public.meta_pixel_config_evaluate(
  p_facts jsonb,
  p_now   timestamptz default now()
) returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.meta_pixel_config_verdict(
    p_facts,
    -- The last run that could actually READ the file. An unreadable day in
    -- between must not erase the baseline, or the next readable day would
    -- have nothing to compare against and a real change would go unshown.
    (select c.detail from public.meta_signal_checks c
      where c.check_key = 'pixel_config' and c.detail ? 'watched_on' and c.checked_at < p_now
      order by c.checked_at desc limit 1),
    p_now);
$$;

-- service_role only, like meta_signal_evaluate. A REVOKE on a function must
-- name PUBLIC, or the default grant survives it (handoff §6).
revoke all on function public.meta_pixel_config_verdict(jsonb, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.meta_pixel_config_evaluate(jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.meta_pixel_config_verdict(jsonb, jsonb, timestamptz) to service_role;
grant execute on function public.meta_pixel_config_evaluate(jsonb, timestamptz) to service_role;
