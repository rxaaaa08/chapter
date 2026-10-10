-- Retargeting ad sets that Meta is allowed to widen into prospecting
-- =============================================================================
-- Cloud audit OPP-3 (CLOUD-META-OPPORTUNITIES.md), built 2026-09-26 at the
-- owner's request.
--
-- THE PROBLEM. Two Meta defaults quietly turn "show this only to people who saw
-- the price and didn't buy" into "show this to anyone Meta likes":
--   * targeting_automation.advantage_audience — "defaults to 1" for new ad sets
--     (Advantage+ Audience guide). Under it an INCLUDED custom audience is only
--     a suggestion; only location, minimum age, language and custom-audience
--     EXCLUSIONS stay hard.
--   * targeting_relaxation_types.custom_audience — Advantage custom audience
--     ("audience expansion"). "Campaigns with supported objectives are enabled
--     by default." Opt out by setting it to 0 inside `targeting`.
-- The §19 audience layer builds disjoint retargeting tiers so each can carry its
-- own message and its own cost per ticket. Widened, those per-tier numbers mean
-- nothing — and nothing said so. No retargeting ad set exists yet, which is why
-- the guard goes in now.
--
-- THE FALSE-ALARM RULE. Meta's docs never say whether targeting_relaxation_types
-- is echoed back in a stored ad set's `targeting`. A check that treated "absent"
-- as "on" could push forever at an ad set the founder had set up correctly. So:
--   * an explicit 1 on either setting               → 'retarget_widened'  (pushes)
--   * advantage_audience explicitly 0, expansion
--     absent from what Meta returned                → 'retarget_expansion_unconfirmed'
--                                                      (page only — "check it
--                                                      once in Ads Manager")
--   * both explicitly 0                             → nothing to say.
-- advantage_audience absent is treated as unconfirmed too, never as a finding.
--
-- WHICH AUDIENCES COUNT. Any included audience from OUR registries —
-- meta_website_audiences (§19 web tiers) and meta_audiences (customer files).
-- Those were all built to be shown to specific people; a lookalike or a
-- hand-made audience is not ours to judge.
--
-- SHAPE CHANGE. Adds a `detail` column, so the function is dropped and made
-- again. get_meta_audience_health() calls it by name at run time (SQL function
-- bodies are not dependency-tracked) and serialises every column, so the panel
-- receives `detail` without any change there.

drop function if exists public.meta_adset_audience_warnings();

create function public.meta_adset_audience_warnings()
returns table (
  adset_id         text,
  adset_name       text,
  campaign_name    text,
  effective_status text,
  issue            text,
  customers        integer,
  detail           jsonb
)
language sql
stable
security definer
set search_path = public
as $function$
  with cust as (
    select audience_id, member_count from public.meta_audiences
     where key = 'customers_all_paid' and audience_id is not null
  ),
  -- An ad set aimed AT customers (a rebooking campaign) is doing something on
  -- purpose, and excluding them there would be the mistake.
  cust_any as (
    select audience_id from public.meta_audiences
     where key in ('customers_all_paid','customers_completed') and audience_id is not null
  ),
  ours as (
    select audience_id, name from public.meta_website_audiences where audience_id is not null
    union
    select audience_id, name from public.meta_audiences where audience_id is not null
  ),
  live as (
    select c.* from public.meta_adset_config c
     where coalesce(c.effective_status, '') not in ('DELETED','ARCHIVED')
       -- NULL targeting means capture failed, not "no settings": unknown is not a finding.
       and c.targeting is not null
  ),
  widening as (
    select l.adset_id, l.adset_name, l.campaign_name, l.effective_status,
           (select jsonb_agg(o.name order by o.name)
              from jsonb_array_elements(coalesce(l.targeting->'custom_audiences', '[]'::jsonb)) e
              join ours o on o.audience_id = e->>'id') as audiences,
           l.targeting->'targeting_automation'->>'advantage_audience'        as adv,
           l.targeting->'targeting_relaxation_types'->>'custom_audience'     as relax_ca,
           l.targeting->'targeting_relaxation_types'->>'lookalike'           as relax_lal
      from live l
  )
  select c.adset_id, c.adset_name, c.campaign_name, c.effective_status,
         'no_customer_exclusion'::text,
         (select member_count from cust),
         null::jsonb
    from live c
   where exists (select 1 from cust)
     and not exists (
       select 1 from jsonb_array_elements(coalesce(c.targeting->'custom_audiences', '[]'::jsonb)) e
        where e->>'id' in (select audience_id from cust_any))
     and not exists (
       select 1 from jsonb_array_elements(coalesce(c.targeting->'excluded_custom_audiences', '[]'::jsonb)) e
        where e->>'id' in (select audience_id from cust))

  union all

  select w.adset_id, w.adset_name, w.campaign_name, w.effective_status,
         case when w.adv = '1' or w.relax_ca = '1' then 'retarget_widened'
              else 'retarget_expansion_unconfirmed' end,
         null::integer,
         jsonb_build_object(
           'audiences', w.audiences,
           -- The raw values, NULL where Meta returned nothing: the panel says
           -- "not shown by Meta" rather than guessing.
           'advantage_audience', w.adv,
           'expansion_custom_audience', w.relax_ca,
           'expansion_lookalike', w.relax_lal
         )
    from widening w
   where w.audiences is not null
     and (
       w.adv = '1' or w.relax_ca = '1'
       or w.adv is null or w.relax_ca is null
     );
$function$;

comment on function public.meta_adset_audience_warnings() is
  'Ad-set audience findings. no_customer_exclusion: pays to reach people who '
  'already bought. retarget_widened: includes one of our audiences while Meta may '
  'widen it (explicit 1). retarget_expansion_unconfirmed: Meta did not echo the '
  'setting — page only. SERVICE ROLE ONLY.';

revoke all on function public.meta_adset_audience_warnings() from public, anon, authenticated;
grant execute on function public.meta_adset_audience_warnings() to service_role;
