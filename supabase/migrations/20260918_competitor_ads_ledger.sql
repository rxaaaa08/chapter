-- Competitor ad ledger — what is running, what has been removed, how long it ran
-- =============================================================================
-- META-ADS-HANDOFF.md §25, Phase 2. Founder's decision 2026-09-18: the metadata
-- lives here rather than in a local file, because he wants to see competitor
-- activity inside Growth ▸ Ads. Deliberately **ids and context only, never the
-- creative** — his words: "I don't want to necessarily see the ad within my
-- admin itself, if I see the id I guess that's enough because I can then see the
-- ad locally by matching the ID."
--
-- So this table is the metadata half of the system. The creative half stays on
-- his Mac in ~/Desktop/ads/<page_label>/<start-date>__<library_id>/, and
-- `library_id` is the join between them: Meta-assigned, globally unique,
-- permanent, never reused. Both halves live on hardware we control, so an ad
-- being deleted from Meta's library breaks neither.
--
-- WHY THIS EXISTS AT ALL. For a local Indian advertiser a stopped ad vanishes
-- from the Ad Library completely (measured 2026-09-18: 6 ads ACTIVE, 0 INACTIVE
-- across three Chennai competitors). Meta tells you an ad started; it never
-- tells you it stopped. "How long did this run" is therefore only ever knowable
-- from our own repeated observation, and is not backfillable at any price.

-- ── Current state, one row per ad ever seen ─────────────────────────────────

create table if not exists public.competitor_ads (
  -- Meta's Library ID. The join to the local creative folder, so it is the PK
  -- rather than a surrogate.
  library_id       text primary key,
  page_id          text not null,
  page_label       text not null,

  -- What Meta displayed, kept verbatim, plus a parsed date for arithmetic.
  -- The parse is exception-safe: an unrecognised format stores NULL rather than
  -- failing the whole ingest.
  started_running  text,
  started_on       date,

  -- OBSERVATION times — when WE saw it, which is not when it started. Meta's
  -- own start date can predate our first sighting by weeks, which is why
  -- days_running below prefers started_on and falls back to first_seen_at.
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),

  -- NULL while live. Set when a successful observation of this page no longer
  -- lists the ad. This is the stop event, and nothing else in the world records
  -- it.
  disappeared_on   timestamptz,

  media_type       text,
  video_duration_s        integer,
  -- Asset much older than the ad = a creative they have used before and brought
  -- back, i.e. one they believe works. Decoded from Meta's own video URL.
  video_asset_age_days    integer,

  -- Whether the creative actually landed on the founder's Mac, and where.
  -- Kept so "we know this ad ran but never got its video" is distinguishable
  -- from "we have it" — the null-versus-zero discipline in §9.
  creative_captured boolean not null default false,
  creative_path     text,

  -- The ad copy. Not the creative: a short excerpt is what makes a row in the
  -- panel readable as something other than a bare number.
  ad_text          text,

  raw              jsonb,
  updated_at       timestamptz not null default now()
);

comment on table public.competitor_ads is
  'Competitor ads seen in the Meta Ad Library: what is running, what has been '
  'removed, and how long it ran. Metadata only — the creative lives on the '
  'founder''s Mac, joined by library_id. Written only by '
  'record_competitor_ads() as the service role. META-ADS-HANDOFF.md §25.';

comment on column public.competitor_ads.disappeared_on is
  'When a SUCCESSFUL observation first failed to list this ad. The stop event. '
  'A failed or empty read never sets this — absence is not deletion.';

create index if not exists competitor_ads_page_idx
  on public.competitor_ads (page_label, disappeared_on nulls first, started_on desc);

alter table public.competitor_ads enable row level security;

drop policy if exists competitor_ads_founder_read on public.competitor_ads;
create policy competitor_ads_founder_read
  on public.competitor_ads for select using (public.is_admin_strict());

revoke all on public.competitor_ads from anon, authenticated;

-- ── Append-only history of the transitions that matter ──────────────────────
-- The same change-only pattern as the five Meta tables in §6: current state is
-- overwritten in place, so every transition gets its own immutable row. This is
-- what survives an ad disappearing and coming back, and what makes a run length
-- reconstructable across gaps in observation.

create table if not exists public.competitor_ad_events (
  id          bigserial primary key,
  library_id  text not null,
  page_label  text not null,
  event       text not null check (event in ('first_seen', 'disappeared', 'reappeared')),
  at          timestamptz not null default now(),
  detail      jsonb
);

comment on table public.competitor_ad_events is
  'Append-only log of competitor ad transitions (first seen / disappeared / '
  'reappeared). Never updated or deleted. META-ADS-HANDOFF.md §25.';

create index if not exists competitor_ad_events_lib_idx
  on public.competitor_ad_events (library_id, at desc);

alter table public.competitor_ad_events enable row level security;

drop policy if exists competitor_ad_events_founder_read on public.competitor_ad_events;
create policy competitor_ad_events_founder_read
  on public.competitor_ad_events for select using (public.is_admin_strict());

revoke all on public.competitor_ad_events from anon, authenticated;

-- ── Safe date parse for Meta's displayed format ─────────────────────────────
create or replace function public.competitor_ad_parse_date(p_text text)
returns date
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_text is null or btrim(p_text) = '' then return null; end if;
  -- Meta renders '11 Aug 2026'. An unrecognised format is recorded as NULL
  -- rather than aborting an entire day's ingest.
  return to_date(btrim(p_text), 'DD Mon YYYY');
exception when others then
  return null;
end;
$$;

revoke all on function public.competitor_ad_parse_date(text) from public, anon, authenticated;
grant execute on function public.competitor_ad_parse_date(text) to service_role;

-- ── The writer ──────────────────────────────────────────────────────────────
-- Service role only. A founder gate would hand the ingest function a NULL and
-- silently stop the capture while looking healthy — the §6 failure class.
--
-- THE SAFETY-CRITICAL ARGUMENT IS `p_ok`. A failed render, a Meta outage or a
-- throttled read all return zero ads, which is indistinguishable from "this
-- competitor switched everything off" unless the caller says which happened.
-- With p_ok false, this records nothing as disappeared. Getting that wrong
-- would mark a competitor's entire live catalogue as dead on the first bad
-- night, and the history would be permanently wrong.
create or replace function public.record_competitor_ads(
  p_page_id    text,
  p_page_label text,
  p_ok         boolean,
  p_ads        jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ad         jsonb;
  v_lib        text;
  v_existing   public.competitor_ads%rowtype;
  v_seen       text[] := '{}';
  v_new        int := 0;
  v_reappeared int := 0;
  v_gone       int := 0;
begin
  if p_page_label is null or btrim(p_page_label) = '' then
    raise exception 'record_competitor_ads: p_page_label is required';
  end if;

  if p_ads is not null and jsonb_typeof(p_ads) = 'array' then
    for v_ad in select * from jsonb_array_elements(p_ads)
    loop
      v_lib := nullif(btrim(v_ad ->> 'library_id'), '');
      continue when v_lib is null;
      v_seen := v_seen || v_lib;

      select * into v_existing from public.competitor_ads where library_id = v_lib;

      insert into public.competitor_ads as t (
        library_id, page_id, page_label, started_running, started_on,
        first_seen_at, last_seen_at, disappeared_on,
        media_type, video_duration_s, video_asset_age_days,
        creative_captured, creative_path, ad_text, raw, updated_at
      ) values (
        v_lib, p_page_id, p_page_label,
        v_ad ->> 'started_running',
        public.competitor_ad_parse_date(v_ad ->> 'started_running'),
        now(), now(), null,
        v_ad ->> 'media_type',
        nullif(v_ad ->> 'video_duration_s', '')::integer,
        nullif(v_ad ->> 'video_asset_age_days', '')::integer,
        coalesce((v_ad ->> 'creative_captured')::boolean, false),
        v_ad ->> 'creative_path',
        v_ad ->> 'ad_text',
        v_ad,
        now()
      )
      on conflict (library_id) do update set
        page_id          = excluded.page_id,
        page_label       = excluded.page_label,
        started_running  = coalesce(excluded.started_running, t.started_running),
        started_on       = coalesce(excluded.started_on, t.started_on),
        last_seen_at     = now(),
        -- Seen again, so it is live again. The transition is logged below.
        disappeared_on   = null,
        media_type       = coalesce(excluded.media_type, t.media_type),
        video_duration_s = coalesce(excluded.video_duration_s, t.video_duration_s),
        video_asset_age_days = coalesce(excluded.video_asset_age_days, t.video_asset_age_days),
        -- Never downgrade a capture we already have: a later observation that
        -- skipped the download (because the folder already existed) must not
        -- erase the fact that the creative is on disk.
        creative_captured = t.creative_captured or excluded.creative_captured,
        creative_path    = coalesce(excluded.creative_path, t.creative_path),
        ad_text          = coalesce(excluded.ad_text, t.ad_text),
        raw              = excluded.raw,
        updated_at       = now();

      if v_existing.library_id is null then
        v_new := v_new + 1;
        insert into public.competitor_ad_events (library_id, page_label, event, detail)
        values (v_lib, p_page_label, 'first_seen',
                jsonb_build_object('started_running', v_ad ->> 'started_running'));
      elsif v_existing.disappeared_on is not null then
        v_reappeared := v_reappeared + 1;
        insert into public.competitor_ad_events (library_id, page_label, event, detail)
        values (v_lib, p_page_label, 'reappeared',
                jsonb_build_object('was_gone_since', v_existing.disappeared_on));
      end if;
    end loop;
  end if;

  -- Disappearances, ONLY on a successful read. See the note above.
  if p_ok then
    for v_lib in
      select library_id from public.competitor_ads
      where page_label = p_page_label
        and disappeared_on is null
        and not (library_id = any(v_seen))
    loop
      update public.competitor_ads
         set disappeared_on = now(), updated_at = now()
       where library_id = v_lib;
      insert into public.competitor_ad_events (library_id, page_label, event)
      values (v_lib, p_page_label, 'disappeared');
      v_gone := v_gone + 1;
    end loop;
  end if;

  return jsonb_build_object(
    'page_label', p_page_label,
    'observed',   coalesce(array_length(v_seen, 1), 0),
    'new',        v_new,
    'reappeared', v_reappeared,
    'disappeared', v_gone,
    'marked_disappearances', p_ok
  );
end;
$$;

comment on function public.record_competitor_ads(text, text, boolean, jsonb) is
  'Records one observation of a competitor page. p_ok=false records sightings '
  'but NEVER marks disappearances — absence is not deletion. SERVICE ROLE ONLY.';

revoke all on function public.record_competitor_ads(text, text, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.record_competitor_ads(text, text, boolean, jsonb) to service_role;

-- ── The founder-facing reader ───────────────────────────────────────────────
-- One jsonb, not a row set: PostgREST silently caps RETURNS TABLE at 1,000 rows.
create or replace function public.get_competitor_ads(p_days integer default 180)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with scoped as (
    select *,
      -- Prefer Meta's own start date: it can predate our first sighting by
      -- weeks, and using first_seen_at would understate every run length.
      coalesce(started_on, first_seen_at::date)                       as effective_start,
      coalesce(disappeared_on, now())::date                           as effective_end
    from public.competitor_ads
    where disappeared_on is null
       or disappeared_on > now() - make_interval(days => greatest(p_days, 1))
  )
  select case when public.is_admin_strict() then jsonb_build_object(
    'running', coalesce((
      select jsonb_agg(jsonb_build_object(
        'library_id',   library_id,
        'page_label',   page_label,
        'started_running', started_running,
        'started_on',   effective_start,
        'days_running', (effective_end - effective_start),
        'media_type',   media_type,
        'video_asset_age_days', video_asset_age_days,
        'creative_captured',    creative_captured,
        'creative_path',        creative_path,
        'excerpt',      left(regexp_replace(coalesce(ad_text, ''), '\s+', ' ', 'g'), 160),
        'first_seen_at', first_seen_at,
        'last_seen_at',  last_seen_at
      ) order by effective_start asc)
      from scoped where disappeared_on is null
    ), '[]'::jsonb),
    'removed', coalesce((
      select jsonb_agg(jsonb_build_object(
        'library_id',   library_id,
        'page_label',   page_label,
        'started_on',   effective_start,
        'disappeared_on', disappeared_on,
        'days_ran',     (effective_end - effective_start),
        'media_type',   media_type,
        'creative_captured', creative_captured,
        'creative_path',     creative_path,
        'excerpt',      left(regexp_replace(coalesce(ad_text, ''), '\s+', ' ', 'g'), 160)
      ) order by disappeared_on desc)
      from scoped where disappeared_on is not null
    ), '[]'::jsonb),
    'summary', jsonb_build_object(
      'running_count',  (select count(*) from scoped where disappeared_on is null),
      'removed_count',  (select count(*) from scoped where disappeared_on is not null),
      'pages_watched',  (select count(distinct page_label) from public.competitor_ads),
      -- NULL means never observed, which is a different answer from "observed,
      -- nothing found" — the §9 null-versus-zero discipline.
      'last_observed_at', (select max(last_seen_at) from public.competitor_ads),
      'longest_running_days', (select max(effective_end - effective_start) from scoped where disappeared_on is null),
      -- Creative we know ran but never got onto the Mac.
      'missing_creative', (select count(*) from scoped where not creative_captured)
    )
  ) end;
$$;

comment on function public.get_competitor_ads(integer) is
  'Founder-gated: competitor ads currently running and recently removed, with '
  'how long each ran and where its creative sits locally. Returns NULL for a '
  'non-founder. META-ADS-HANDOFF.md §25.';

revoke all on function public.get_competitor_ads(integer) from public, anon, authenticated;
grant execute on function public.get_competitor_ads(integer) to authenticated;
