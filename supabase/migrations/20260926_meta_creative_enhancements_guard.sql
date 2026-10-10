-- Meta's automatic "creative enhancements" — a pre-flight check for defaults nobody chose
-- =============================================================================
-- Cloud audit OPP-1 (CLOUD-META-OPPORTUNITIES.md), built 2026-09-26 at the
-- owner's request.
--
-- WHAT IT CATCHES. Every Meta ad creative carries a block saying which AI and
-- automation features are on for it. Meta's own reference documents several as
-- ON unless the ad says otherwise:
--   * adapt_to_placement     — "Image touch-ups" in Ads Manager (auto crop/adjust).
--                              "Default is opt-in." (ad-creative-features-spec)
--   * description_automation — Meta writes the description. "Default is opt-in."
--   * inline_comment         — "Relevant comments": a stranger's comment shown
--                              under the ad. "Default is opt-in."
--   * contextual_multi_ads   — the ad placed in a strip beside OTHER brands' ads.
--                              "Ads created on or after August 19, 2024 that do
--                              not specify the enroll_status field will be opted
--                              into multi-advertiser ads by default."
-- A curated club sells trust. Each of these is a brand decision made by a
-- default rather than by the founder — the same pattern as the Audience Network
-- and Threads defaults already found and watched (handoff §10, §23).
--
-- WHERE IT RUNS. In meta-ads-sync, in the SAME creative read that already checks
-- {{ad.id}} (20260918_meta_ad_creative_tracking_tags.sql), so it too speaks up
-- BEFORE any money moves. Read-only: `ads_read`, notify-only (§15). Nothing here
-- writes to Meta.
--
-- THE TWO RULES THAT KEEP IT HONEST
--   1. "Absent" means ON only where Meta documents the default as ON. For every
--      other feature on the list the docs never state a default, so a feature
--      absent from the block is NOT reported — only an explicit OPT_IN is.
--      (Music is deliberately not on the list at all: its default is undocumented.)
--   2. A read that did not ASK for these fields says nothing. The sync's field
--      ladder can step down to a shape without them (an unknown field is a hard
--      400), and "not requested" must never read as "all off" OR "all on".
--      `enhancements_read` records which it was.

-- ── The watch list — the founder's list, as data ────────────────────────────
-- A table rather than a constant so it can be changed without a deploy. The
-- starting list was chosen by the building session on 2026-09-26 (see handoff
-- §30): everything that changes what the ad LOOKS like or SAYS, plus placing it
-- beside other brands. Set `watch = false` on a row to stop hearing about it.
create table if not exists public.meta_creative_feature_watch (
  feature_key      text primary key,
  label            text not null,           -- the Ads Manager wording, where Meta gives one
  why              text not null,
  -- true  = Meta documents this as ON unless opted out, so absent counts as ON.
  -- false = default undocumented; only an explicit OPT_IN counts.
  default_on       boolean not null default false,
  watch            boolean not null default true,
  sort_order       int not null default 100
);

comment on table public.meta_creative_feature_watch is
  'Which Meta creative enhancements the founder does not want switched on by '
  'default. Read by meta_creative_unwanted_enhancements(). default_on=true only '
  'where Meta''s docs state the default is opt-in.';

alter table public.meta_creative_feature_watch enable row level security;
revoke all on public.meta_creative_feature_watch from anon, authenticated;

insert into public.meta_creative_feature_watch (feature_key, label, why, default_on, sort_order) values
  ('contextual_multi_ads',   'Multi-advertiser ads',   'Shows your ad in a strip next to other brands'' ads.', true, 10),
  ('inline_comment',         'Relevant comments',      'Shows a stranger''s comment under your ad.', true, 20),
  ('adapt_to_placement',     'Image touch-ups',        'Meta crops and adjusts your images per placement.', true, 30),
  ('description_automation', 'Description automation', 'Meta writes the ad''s description text.', true, 40),
  ('standard_enhancements',  'Standard enhancements',  'Meta''s bundle of automatic creative changes.', false, 50),
  ('image_touchups',         'Visual touch-ups',       'Meta edits the look of your images.', false, 60),
  ('image_templates',        'Add overlays / templates','Meta frames your image in a template.', false, 70),
  ('image_background_gen',   'Generated backgrounds',  'Meta generates a new background for your image.', false, 80),
  ('image_animation',        'Image animation',        'Meta animates your still image.', false, 90),
  ('text_optimizations',     'Text improvements',      'Meta swaps your headline and primary text around.', false, 100),
  ('text_translation',       'Translate text',         'Meta translates your ad copy.', false, 110),
  ('translate_voiceover',    'Translate voiceover',    'Meta dubs your video into another language.', false, 120),
  ('text_overlay_translation','Translate text overlay','Meta translates words printed on the image.', false, 130),
  ('replace_media_text',     'Replace media text',     'Meta rewrites text inside the image.', false, 140),
  ('add_text_overlay',       'Dynamic overlays',       'Meta prints extra information on top of the image.', false, 150),
  ('creative_stickers',      'Stickers',               'Meta adds stickers to the creative.', false, 160),
  ('generate_cta',           'Generated call to action','Meta writes the button text.', false, 170),
  ('multi_photo_to_video',   'Photos to video',        'Meta turns your photos into a video.', false, 180),
  ('video_to_image',         'Video to image',         'Meta turns your video into a still.', false, 190),
  ('video_highlights',       'Video highlights',       'Meta cuts your video down to clips it picks.', false, 200),
  ('music_generation',       'Generated music',        'Meta generates music for the ad.', false, 210),
  ('profile_card',           'Profile card',           'Meta adds a profile card to the ad.', false, 220),
  ('site_extensions',        'Site links',             'Meta adds extra links to other pages of the site.', false, 230),
  ('show_summary',           'Show summary',           'Meta adds an AI summary to the ad.', false, 240),
  ('reveal_details_over_time','Reveal details over time','Meta changes what the ad shows as it runs.', false, 250)
on conflict (feature_key) do nothing;

-- ── The verdict ─────────────────────────────────────────────────────────────
-- Given one creative's raw JSON (as Meta returned it), which WATCHED features are
-- on? Returns labels in watch-list order; an empty array means "read, and none
-- on". Callers must only use it on a read that requested the fields (rule 2).
--
-- Where each lives: contextual_multi_ads is a field on the creative itself;
-- every other feature sits in degrees_of_freedom_spec.creative_features_spec.
create or replace function public.meta_creative_unwanted_enhancements(p_raw jsonb)
returns text[]
language sql
stable
set search_path = public
as $$
  select coalesce(array_agg(w.label order by w.sort_order), '{}')
  from public.meta_creative_feature_watch w
  cross join lateral (
    select case w.feature_key
             when 'contextual_multi_ads' then p_raw -> 'contextual_multi_ads' ->> 'enroll_status'
             else p_raw -> 'degrees_of_freedom_spec' -> 'creative_features_spec' -> w.feature_key ->> 'enroll_status'
           end as status
  ) s
  where w.watch
    and (
      upper(coalesce(s.status, '')) = 'OPT_IN'
      -- Absent, or any value that is not an explicit opt-out, counts as ON only
      -- where Meta documents the default as ON.
      or (w.default_on and upper(coalesce(s.status, '')) <> 'OPT_OUT')
    );
$$;

comment on function public.meta_creative_unwanted_enhancements(jsonb) is
  'Watched Meta creative enhancements that are ON for a creative''s raw JSON. '
  'Absent counts as ON only for features Meta documents as default opt-in.';

revoke all on function public.meta_creative_unwanted_enhancements(jsonb) from public, anon, authenticated;
grant execute on function public.meta_creative_unwanted_enhancements(jsonb) to service_role;

-- ── Columns on the existing per-creative table ──────────────────────────────
alter table public.meta_ad_creative_tags
  add column if not exists enhancements_read boolean not null default false,
  add column if not exists enhancements_on   text[];

comment on column public.meta_ad_creative_tags.enhancements_read is
  'true when the last read asked Meta for degrees_of_freedom_spec and '
  'contextual_multi_ads. false means the ladder stepped down: unknown, not "none".';
comment on column public.meta_ad_creative_tags.enhancements_on is
  'Watched enhancements ON at the last read (labels). NULL when not read.';

-- ── The writer, extended ────────────────────────────────────────────────────
-- Same function the sync already calls; one new input per row
-- (`enhancements_read`) and two new columns out. Everything else is unchanged
-- from the live definition dumped 2026-09-26.
create or replace function public.record_ad_creative_tags(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_row       jsonb;
  v_verdict   text;
  v_prev      text;
  v_recorded  int := 0;
  v_changed   int := 0;
  v_creative  text;
  v_enh_read  boolean;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return jsonb_build_object('recorded', 0, 'changed', 0);
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_creative := nullif(trim(v_row ->> 'creative_id'), '');
    continue when v_creative is null;

    v_verdict := public.meta_creative_tag_verdict(
      v_row ->> 'url_tags',
      v_row -> 'raw'
    );
    v_enh_read := coalesce((v_row ->> 'enhancements_read')::boolean, false);

    select verdict into v_prev
      from public.meta_ad_creative_tags
     where creative_id = v_creative;

    insert into public.meta_ad_creative_tags as t (
      creative_id, creative_name, ad_ids, ad_names, adset_id, campaign_id,
      effective_status, url_tags, raw, verdict, has_placement_macro,
      enhancements_read, enhancements_on,
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
      v_enh_read,
      case when v_enh_read then public.meta_creative_unwanted_enhancements(coalesce(v_row -> 'raw', '{}'::jsonb)) end,
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
      enhancements_read   = excluded.enhancements_read,
      enhancements_on     = excluded.enhancements_on,
      last_seen_at        = now(),
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
$function$;

revoke all on function public.record_ad_creative_tags(jsonb) from public, anon, authenticated;
grant execute on function public.record_ad_creative_tags(jsonb) to service_role;

-- ── What the sync pushes about ──────────────────────────────────────────────
-- Not gated on ACTIVE, for the same reason as the {{ad.id}} warning: the right
-- moment is BEFORE the ad runs. Archived and deleted ads are finished.
create or replace function public.meta_ad_enhancement_warnings()
returns table (
  creative_id      text,
  creative_name    text,
  ad_ids           text[],
  ad_names         text[],
  effective_status text,
  enhancements_on  text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select t.creative_id, t.creative_name, t.ad_ids, t.ad_names,
         t.effective_status, t.enhancements_on
  from public.meta_ad_creative_tags t
  where t.enhancements_read
    and coalesce(array_length(t.enhancements_on, 1), 0) > 0
    and coalesce(t.effective_status, '') not in ('ARCHIVED', 'DELETED')
  order by t.last_seen_at desc;
$$;

comment on function public.meta_ad_enhancement_warnings() is
  'Live ads (incl. PAUSED) whose creative has a watched Meta enhancement on. '
  'SERVICE ROLE ONLY.';

revoke all on function public.meta_ad_enhancement_warnings() from public, anon, authenticated;
grant execute on function public.meta_ad_enhancement_warnings() to service_role;

-- ── The founder-facing reader, extended ─────────────────────────────────────
-- Same shape as before plus the two enhancement fields per creative and one
-- summary count. Growth ▸ Ads reads this in the new "Before an ad spends" card.
create or replace function public.get_meta_ad_tracking_tags()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin_strict() then jsonb_build_object(
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
               'enhancements_read', t.enhancements_read,
               'enhancements_on',  t.enhancements_on,
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
      'with_placement_macro', (select count(*) from public.meta_ad_creative_tags
                                where has_placement_macro
                                  and coalesce(effective_status, '') not in ('ARCHIVED','DELETED')),
      'with_enhancements', (select count(*) from public.meta_ad_creative_tags
                             where enhancements_read
                               and coalesce(array_length(enhancements_on, 1), 0) > 0
                               and coalesce(effective_status, '') not in ('ARCHIVED','DELETED'))
    ),
    'watched_features', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'why', why, 'default_on', default_on)
                       order by sort_order)
      from public.meta_creative_feature_watch where watch
    ), '[]'::jsonb)
  ) end;
$$;

revoke all on function public.get_meta_ad_tracking_tags() from public, anon, authenticated;
grant execute on function public.get_meta_ad_tracking_tags() to authenticated;
