-- Does every ad actually carry {{ad.id}}? — the pre-flight check
-- =============================================================================
-- META-ADS-HANDOFF.md calls `{{ad.id}}` in the ad's URL Parameters field "the
-- only irreversible-if-missed item in the whole system": it is the entire join
-- between Meta's spend and our bookings, and a click that lands without it can
-- never be attributed to an ad, ever, by anyone. Until now it was a hope — a
-- line in META-ADS-SETUP.md and a red strip on a panel nobody has pushed.
--
-- Meta's Instagram Ads API docs ("Use URL Tags for Tracking", 2026-09-18) name
-- the field that box writes to: the ad creative's `url_tags`. Three facts follow
-- and together they are why this migration exists.
--
--   1. It is PER CREATIVE. There is no account-level default to set once. Every
--      creative ever made has to carry it, so the chance of getting this wrong
--      does not go away after the first ad — it recurs on every new ad forever.
--   2. It is READABLE. `GET /<creative_id>?fields=url_tags` is a read, so it
--      sits inside our `ads_read` token and the notify-only decision (§15).
--      Nothing here writes to Meta.
--   3. It can be checked BEFORE ANY MONEY MOVES. A creative exists the moment an
--      ad is created, ahead of the first impression. Every other tracking alarm
--      we have needs spend to have happened first, and `untagged_spend` is
--      deliberately silent until the website client ships (§5 Layer 7). This one
--      has neither dependency, which is the whole point: the mistake it catches
--      is only fixable before the traffic arrives.
--
-- WHY THERE IS NO HISTORY TABLE, unlike the five change-only tables in §6.
-- Meta's Marketing API overview states that ad creatives are immutable once
-- created — "you can't change them once they're created". So a creative's
-- url_tags cannot drift the way targeting, learning state and delivery settings
-- do, and versioning it would be machinery guarding against something the
-- platform does not permit. `tags_changed_at` is kept anyway, moving only on a
-- real change, so that if Meta ever does allow an edit the fact is recorded
-- rather than silently overwritten. A row appearing there is itself news.

-- ── The table ───────────────────────────────────────────────────────────────

create table if not exists public.meta_ad_creative_tags (
  -- One row per CREATIVE, not per ad: several ads can share one creative, and
  -- the tag lives on the creative. `ad_ids` carries every ad pointing at it.
  creative_id     text primary key,
  creative_name   text,

  -- Every ad using this creative, and the worst delivery state among them.
  -- Denormalised on purpose: the warning has to name an ad the founder can find
  -- in Ads Manager, and joining back to meta_delivery_objects would make the
  -- check depend on the delivery step having run first.
  ad_ids          text[] not null default '{}',
  ad_names        text[] not null default '{}',
  adset_id        text,
  campaign_id     text,
  effective_status text,

  -- What Meta returned, kept whole. Same reasoning as meta_ad_daily's raw
  -- action arrays: a question asked later is then a query rather than a re-sync,
  -- and a creative cannot be re-read once it is deleted.
  url_tags        text,
  raw             jsonb,

  -- The verdict, computed in SQL by meta_creative_tag_verdict() below.
  --   'ok'      — the ad-id macro is present.
  --   'missing' — no utm_content at all. Traffic lands untagged and unjoinable.
  --   'wrong'   — utm_content is present but is NOT the macro (a hardcoded
  --               string, or a different macro). THIS IS THE DANGEROUS ONE: the
  --               ad reads as tagged everywhere a human would look, and joins to
  --               nothing. Same shape as the unsubstituted-{{macro}} finding in
  --               §10, in a new place.
  verdict         text not null check (verdict in ('ok', 'missing', 'wrong')),

  -- Recorded, never alarmed on. `src/attribution.ts` captures `placement` and
  -- `site_source_name`, and "Get Ad Insights" (2026-09-18) confirms
  -- SITE_SOURCE_NAME is the documented url_tags macro for it — but the client
  -- that reads them is NOT pushed. Alarming on a gap our own undeployed code
  -- causes is exactly the mistake the untagged_spend capture gate was built to
  -- stop (§5 Layer 7). So this is a fact for the page, not a reason to push.
  has_placement_macro boolean not null default false,

  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  -- Moves only on a real change. See the immutability note above.
  tags_changed_at timestamptz
);

comment on table public.meta_ad_creative_tags is
  'Per ad creative: whether its url_tags carry utm_content={{ad.id}}, the join '
  'between Meta spend and our bookings. Read-only against Meta (ads_read). '
  'Written only by record_ad_creative_tags() as the service role. No history '
  'table because Meta documents ad creatives as immutable once created. '
  'META-ADS-HANDOFF.md §23.';

comment on column public.meta_ad_creative_tags.verdict is
  '''ok'' | ''missing'' | ''wrong''. ''wrong'' means utm_content is present but is '
  'not the {{ad.id}} macro — the ad looks tracked and joins to nothing.';

create index if not exists meta_ad_creative_tags_verdict_idx
  on public.meta_ad_creative_tags (verdict, last_seen_at desc);

alter table public.meta_ad_creative_tags enable row level security;

drop policy if exists meta_ad_creative_tags_founder_read on public.meta_ad_creative_tags;
create policy meta_ad_creative_tags_founder_read
  on public.meta_ad_creative_tags for select
  using (public.is_admin_strict());

-- Tables and functions need DIFFERENT revokes, and only one of them is obvious.
-- Supabase grants table privileges directly to `anon`/`authenticated`, so naming
-- them here is enough (verified: anon SELECT raises permission denied). Postgres
-- grants FUNCTION execute to PUBLIC, which those roles inherit through and which
-- a revoke naming them does not touch — so every `revoke ... on function` below
-- names `public` as well. See 20260918_meta_ad_creative_tags_revoke_public.sql
-- for the hole this left for one minute, and how it was nearly missed.
revoke all on public.meta_ad_creative_tags from anon, authenticated;

-- ── The verdict, in SQL rather than TypeScript ──────────────────────────────
-- House rule (§6, "the change-only history pattern"): the comparison happens in
-- SQL. Here the reason is not key ordering but changeability — which macro
-- counts is the rule this whole system turns on, and keeping it in Postgres
-- means correcting it is a CREATE OR REPLACE rather than an edge-function
-- deploy.
--
-- IT SEARCHES THE WHOLE CREATIVE, NOT ONLY `url_tags`, AND THAT IS DELIBERATE.
-- Parameters typed directly into the destination URL work exactly as well as
-- ones in the URL Parameters box — Meta substitutes macros in both. An ad
-- tagged that way is correctly tracked, so a check that read url_tags alone
-- would raise a false alarm on a perfectly good ad. Every real bug testing has
-- found in this system was an alarm firing on something healthy (§11), so the
-- search is deliberately wide: it can only err toward silence.
--
-- What it does NOT claim: that EVERY link in a multi-link creative is tagged.
-- It answers "does this creative carry the ad-id macro at all". A creative with
-- one tagged and one untagged destination reads as ok. That is a real limit,
-- recorded rather than engineered around, because no such creative exists yet
-- and guessing at its shape would be inventing a requirement.
create or replace function public.meta_creative_tag_verdict(
  p_url_tags text,
  p_raw      jsonb
) returns text
language sql
immutable
set search_path = public
as $$
  select case
    -- The macro, whitespace-tolerant. Meta documents exactly one spelling for
    -- the ad id ({{ad.id}}); there is no alternative form to accept.
    when haystack ~ 'utm_content\s*=\s*\{\{\s*ad\.id\s*\}\}' then 'ok'
    -- Present but not the macro. Worse than absent, because it looks fine.
    when haystack ~ 'utm_content\s*='                        then 'wrong'
    else 'missing'
  end
  from (select coalesce(p_url_tags, '') || ' ' || coalesce(p_raw::text, '') as haystack) h;
$$;

comment on function public.meta_creative_tag_verdict(text, jsonb) is
  'ok | wrong | missing for one creative''s tracking tags. Searches the whole '
  'creative, not just url_tags, because parameters put directly in the '
  'destination URL track identically and must not raise a false alarm.';

revoke all on function public.meta_creative_tag_verdict(text, jsonb) from public, anon, authenticated;
grant execute on function public.meta_creative_tag_verdict(text, jsonb) to service_role;

-- ── The writer ──────────────────────────────────────────────────────────────
-- Service role only. A founder gate here would hand the cron a NULL and the
-- check would stop recording while looking perfectly healthy — the exact
-- failure class §6 exists to warn about.
create or replace function public.record_ad_creative_tags(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row       jsonb;
  v_verdict   text;
  v_prev      text;
  v_recorded  int := 0;
  v_changed   int := 0;
  v_creative  text;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return jsonb_build_object('recorded', 0, 'changed', 0);
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_creative := nullif(trim(v_row ->> 'creative_id'), '');
    -- An id-less object is skipped rather than stored under a made-up key,
    -- same rule as record_delivery_states().
    continue when v_creative is null;

    v_verdict := public.meta_creative_tag_verdict(
      v_row ->> 'url_tags',
      v_row -> 'raw'
    );

    select verdict into v_prev
      from public.meta_ad_creative_tags
     where creative_id = v_creative;

    insert into public.meta_ad_creative_tags as t (
      creative_id, creative_name, ad_ids, ad_names, adset_id, campaign_id,
      effective_status, url_tags, raw, verdict, has_placement_macro,
      first_seen_at, last_seen_at, tags_changed_at
    )
    values (
      v_creative,
      v_row ->> 'creative_name',
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_row -> 'ad_ids',   '[]'::jsonb)) x), '{}'),
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_row -> 'ad_names', '[]'::jsonb)) x), '{}'),
      v_row ->> 'adset_id',
      v_row ->> 'campaign_id',
      upper(nullif(trim(v_row ->> 'effective_status'), '')),
      v_row ->> 'url_tags',
      v_row -> 'raw',
      v_verdict,
      coalesce(v_row ->> 'url_tags', '') || ' ' || coalesce((v_row -> 'raw')::text, '')
        ~ '\{\{\s*(site_source_name|placement)\s*\}\}',
      now(), now(), null
    )
    on conflict (creative_id) do update set
      creative_name       = excluded.creative_name,
      ad_ids              = excluded.ad_ids,
      ad_names            = excluded.ad_names,
      adset_id            = excluded.adset_id,
      campaign_id         = excluded.campaign_id,
      effective_status    = excluded.effective_status,
      url_tags            = excluded.url_tags,
      raw                 = excluded.raw,
      verdict             = excluded.verdict,
      has_placement_macro = excluded.has_placement_macro,
      last_seen_at        = now(),
      -- Only a real verdict change stamps this. Creatives are documented
      -- immutable, so this should never move; if it does, that is the finding.
      tags_changed_at     = case
                              when t.verdict is distinct from excluded.verdict then now()
                              else t.tags_changed_at
                            end;

    v_recorded := v_recorded + 1;
    if v_prev is not null and v_prev is distinct from v_verdict then
      v_changed := v_changed + 1;
    end if;
  end loop;

  return jsonb_build_object('recorded', v_recorded, 'changed', v_changed);
end;
$$;

comment on function public.record_ad_creative_tags(jsonb) is
  'Records one batch of ad creatives and their tracking-tag verdict. '
  'SERVICE ROLE ONLY — a founder gate would silently disable the capture for '
  'the cron. META-ADS-HANDOFF.md §23.';

revoke all on function public.record_ad_creative_tags(jsonb) from public, anon, authenticated;
grant execute on function public.record_ad_creative_tags(jsonb) to service_role;

-- ── The warning ─────────────────────────────────────────────────────────────
-- Ungated core, granted to service_role alone, for the same reason as
-- meta_ad_guardrail_breaches() and meta_adset_optimization_warnings(): it is
-- called by an edge function as the service role, for which is_admin_strict()
-- is false.
--
-- WHY THIS ALARMS ON PAUSED ADS, WHERE EVERY OTHER WARNING HERE DOES NOT.
-- The learning-phase and customer-exclusion warnings stay quiet on a paused ad
-- set because a paused ad set spends nothing, so its misconfiguration costs
-- nothing until it runs. This one is the opposite case: the damage is done by
-- the FIRST untagged click, and it cannot be undone afterwards at any price.
-- The moment worth speaking up is therefore before the ad is switched on, not
-- after. Archived and deleted ads are excluded — those are finished, and
-- nagging about them would be the noise that trains someone to swipe alarms
-- away.
create or replace function public.meta_ad_tracking_tag_warnings()
returns table (
  creative_id      text,
  creative_name    text,
  ad_ids           text[],
  ad_names         text[],
  effective_status text,
  verdict          text,
  url_tags         text
)
language sql
security definer
set search_path = public
as $$
  select t.creative_id, t.creative_name, t.ad_ids, t.ad_names,
         t.effective_status, t.verdict, t.url_tags
  from public.meta_ad_creative_tags t
  where t.verdict in ('missing', 'wrong')
    and coalesce(t.effective_status, '') not in ('ARCHIVED', 'DELETED')
  order by
    -- 'wrong' first: it is the one that looks healthy from every other angle.
    case t.verdict when 'wrong' then 0 else 1 end,
    t.last_seen_at desc;
$$;

comment on function public.meta_ad_tracking_tag_warnings() is
  'Live ads whose creative does not carry utm_content={{ad.id}}. SERVICE ROLE '
  'ONLY. Includes PAUSED ads deliberately: an untagged click is unattributable '
  'forever, so the moment to fix it is before the ad runs.';

revoke all on function public.meta_ad_tracking_tag_warnings() from public, anon, authenticated;
grant execute on function public.meta_ad_tracking_tag_warnings() to service_role;

-- ── The founder-facing reader ───────────────────────────────────────────────
-- One jsonb, not a row set, because PostgREST silently caps a RETURNS TABLE at
-- 1,000 rows (auto-memory `postgrest-max-rows-cap`).
create or replace function public.get_meta_ad_tracking_tags()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case when public.is_admin_strict() then jsonb_build_object(
    -- NULL here means the check has never run, which is a different answer from
    -- "ran, found no ads". Same null-versus-zero discipline as §9, and the same
    -- bug meta_ads_sync_log exists to prevent: an account with no ads writes no
    -- rows, so a row count alone would read as "never connected".
    'capture_since', (select min(first_seen_at) from public.meta_ad_creative_tags),
    'last_read_at',  (select max(last_seen_at)  from public.meta_ad_creative_tags),
    'creatives', coalesce((
      select jsonb_agg(jsonb_build_object(
               'creative_id',      t.creative_id,
               'creative_name',    t.creative_name,
               'ad_ids',           t.ad_ids,
               'ad_names',         t.ad_names,
               'adset_id',         t.adset_id,
               'campaign_id',      t.campaign_id,
               'effective_status', t.effective_status,
               'verdict',          t.verdict,
               'url_tags',         t.url_tags,
               'has_placement_macro', t.has_placement_macro,
               'first_seen_at',    t.first_seen_at,
               'last_seen_at',     t.last_seen_at,
               'tags_changed_at',  t.tags_changed_at
             ) order by case t.verdict when 'wrong' then 0 when 'missing' then 1 else 2 end,
                        t.last_seen_at desc)
      from public.meta_ad_creative_tags t
      where coalesce(t.effective_status, '') not in ('ARCHIVED', 'DELETED')
    ), '[]'::jsonb),
    'summary', jsonb_build_object(
      'total',   (select count(*) from public.meta_ad_creative_tags
                   where coalesce(effective_status, '') not in ('ARCHIVED','DELETED')),
      'ok',      (select count(*) from public.meta_ad_creative_tags
                   where verdict = 'ok'
                     and coalesce(effective_status, '') not in ('ARCHIVED','DELETED')),
      'missing', (select count(*) from public.meta_ad_creative_tags
                   where verdict = 'missing'
                     and coalesce(effective_status, '') not in ('ARCHIVED','DELETED')),
      'wrong',   (select count(*) from public.meta_ad_creative_tags
                   where verdict = 'wrong'
                     and coalesce(effective_status, '') not in ('ARCHIVED','DELETED')),
      -- Reported, never pushed: the client that consumes these is unpushed, so
      -- a zero here is about us, not about the ads.
      'with_placement_macro', (select count(*) from public.meta_ad_creative_tags
                                where has_placement_macro
                                  and coalesce(effective_status, '') not in ('ARCHIVED','DELETED'))
    )
  ) end;
$$;

comment on function public.get_meta_ad_tracking_tags() is
  'Founder-gated view of every live ad creative''s tracking tags, for '
  'Growth ▸ Ads. Returns NULL for a non-founder.';

revoke all on function public.get_meta_ad_tracking_tags() from public, anon, authenticated;
grant execute on function public.get_meta_ad_tracking_tags() to authenticated;
