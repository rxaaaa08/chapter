-- SQL fixes from the 2026-09-24/26 cloud Meta audit (CLOUD-META-AUDIT.md) and the
-- live checks in META-ADS-HANDOFF.md §28. One migration, five small changes:
--
--   A-7   meta_adset_config.attribution_setting — the ad set's attribution window,
--         read by meta-ads-sync. The live ad set was on 1d_click (§28.7) and
--         nothing recorded it.
--   A-14  meta_normalise_placements keeps threads_positions + whatsapp_positions;
--         meta_adset_placement_warnings gains a page-only `whatsapp_on` finding.
--   A-6   (companion) the placements_unknown comment no longer claims Meta has
--         nothing to report for a never-delivered ad set — that was our request
--         shape, fixed in meta-ads-sync the same day.
--   A-11  meta_adset_optimization_warnings maps INITIATED_CHECKOUT as well as
--         INITIATE_CHECKOUT (Meta's own docs spell it both ways).
--   A-9   meta_catalog_items caps title at 100 (Meta's product limit), not 150.
--
-- WHY the functions are patched with replace() on their LIVE text rather than
-- re-declared in full: supabase/migrations/ is known to lag the live database
-- (273 applied vs 190 files on 2026-09-21), so a full re-declaration copied from
-- an old migration could silently roll back a later live change. Each patch
-- asserts that its anchor text exists and fails the whole migration otherwise,
-- so a drifted definition stops this migration instead of being half-edited.

alter table public.meta_adset_config
  add column if not exists attribution_setting text;
comment on column public.meta_adset_config.attribution_setting is
  'Meta attribution window for this ad set (e.g. 1d_click, 7d_click, 1d_view_7d_click), read by meta-ads-sync. Meta only credits conversions inside it. Cloud audit A-7.';

-- A-14: two more placement keys. Short enough to restate in full.
create or replace function public.meta_normalise_placements(p_effective jsonb, p_targeting jsonb)
returns jsonb
language sql
immutable
set search_path to ''
as $function$
  with keys(k) as (
    values ('publisher_platforms'),
           ('facebook_positions'),
           ('instagram_positions'),
           ('audience_network_positions'),
           ('messenger_positions'),
           ('threads_positions'),
           ('whatsapp_positions'),
           ('device_platforms'),
           ('brand_safety_content_filter_levels')
  ),
  vals as (
    select k, public.meta_sorted_jsonb_array(p_effective -> k) as v from keys
  )
  select jsonb_build_object(
    'placements', coalesce(
      (select jsonb_object_agg(k, v) from vals where v is not null),
      '{}'::jsonb
    ),
    'explicitly_set', coalesce(
      (select jsonb_agg(k order by k) from keys where coalesce(p_targeting, '{}'::jsonb) ? k),
      '[]'::jsonb
    )
  );
$function$;

do $patch$
declare
  v_def text;
  v_new text;
begin
  -- ── A-14 + A-6: placement warnings ──────────────────────────────────────
  v_def := pg_get_functiondef('public.meta_adset_placement_warnings()'::regprocedure);
  v_new := replace(v_def,
$old$  union all

  -- The three states, kept apart.$old$,
$new$  union all

  -- WhatsApp marketing messages as a placement (cloud audit A-14). Meta adds it
  -- automatically under Advantage+ placements for eligible accounts (Marketing
  -- Messages guide :102). Page-only: meta-ads-sync pushes only the two Audience
  -- Network findings, and whether to allow this is an owner decision (OPP-13).
  select c.adset_id, c.adset_name, c.campaign_name, c.effective_status,
         'whatsapp_on'::text,
         jsonb_build_object('publisher_platforms', c.p -> 'publisher_platforms',
                            'whatsapp_positions', c.p -> 'whatsapp_positions'),
         (c.chose ? 'publisher_platforms' or c.chose ? 'whatsapp_positions'),
         case when (c.chose ? 'publisher_platforms' or c.chose ? 'whatsapp_positions')
              then 'info' else 'leak' end
  from c
  where (c.p -> 'publisher_platforms') ? 'whatsapp'
     or jsonb_array_length(coalesce(c.p -> 'whatsapp_positions', '[]'::jsonb)) > 0

  union all

  -- The three states, kept apart.$new$);
  if v_new = v_def then raise exception 'meta_adset_placement_warnings: whatsapp anchor not found — live definition drifted'; end if;
  v_def := v_new;
  v_new := replace(v_def,
$old$meta_returned_none = it asked and Meta had nothing to say, which on this
  -- account means the ad set has never delivered and no placement was ever
  -- chosen by hand.$old$,
$new$meta_returned_none = it asked and Meta had nothing to say. Until
  -- 2026-09-26 that was EVERY reading, because the sync asked for placements
  -- at the wrong level (cloud audit A-6); since the fix, Meta returns them even
  -- for a never-delivered ad set, so this state should now be rare.$new$);
  if v_new = v_def then raise exception 'meta_adset_placement_warnings: comment anchor not found — live definition drifted'; end if;
  execute v_new;

  -- ── A-11: both spellings of InitiateCheckout ────────────────────────────
  v_def := pg_get_functiondef('public.meta_adset_optimization_warnings()'::regprocedure);
  v_new := replace(v_def,
$old$          when 'INITIATE_CHECKOUT'  then 'InitiateCheckout'$old$,
$new$          when 'INITIATE_CHECKOUT'  then 'InitiateCheckout'
          -- Ad Promoted Object reference spells it INITIATED_CHECKOUT; the Pixel
          -- reference says INITIATE_CHECKOUT. Both, as for ViewContent (A-11).
          when 'INITIATED_CHECKOUT' then 'InitiateCheckout'$new$);
  if v_new = v_def then raise exception 'meta_adset_optimization_warnings: anchor not found — live definition drifted'; end if;
  execute v_new;

  -- ── A-9: catalog title limit ─────────────────────────────────────────────
  v_def := pg_get_functiondef('public.meta_catalog_items()'::regprocedure);
  v_new := replace(v_def,
$old$    left(btrim(s.title), 150),$old$,
$new$    -- Meta's product title limit is 100 (Items Batch reference :122). A-9.
    left(btrim(s.title), 100),$new$);
  if v_new = v_def then raise exception 'meta_catalog_items: anchor not found — live definition drifted'; end if;
  execute v_new;
end
$patch$;
