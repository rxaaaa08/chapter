-- Plans as Meta would see them: one row per live, bookable plan, carrying the
-- price, image, link and availability an ad or a catalog would show, and every
-- reason it is not ready to be advertised.
--
-- WHY THIS EXISTS
-- Meta's Advantage+ catalog doc models a business as products with an id, a
-- price, an image, a landing link and an availability. Read against our data on
-- 2026-09-11, three of those five were not safely answerable:
--   * PRICE. Every open event stores price_full = 0 at plan level; the real price
--     lives per city in city_details, resolved by resolveDefaultFullPrice in
--     src/eventPricing.ts. A feed reading price_full would advertise Founders Meet
--     at ₹0. Mirrored below in meta_plan_price — keep the two in step.
--   * IMAGE. No live plan had a hero_image. Two shared the same two video
--     thumbnails and Founders Meet had no media at all. In a catalog ad the image
--     IS the ad.
--   * LINK. The only URL that opens one plan is /?preview_event=<slug>
--     (vercel.json exempts it from the / -> /lifestyle redirect). It works for a
--     customer, and until 2026-09-11 it did not report a plan view to Meta.
-- The id half was already right: every Pixel product event carries the plan slug
-- in content_ids (28 days to 2026-09-11: 1,718 of 1,718 rows, zero orphans), so a
-- catalog keyed on slug matches from its first day.
--
-- ONE SOURCE, TWO READERS. meta-catalog-feed serves these rows to Meta as a
-- product feed; get_meta_catalog_readiness shows the founder the same rows with
-- their problems. What the card passes is exactly what Meta receives.

-- Mirrors parseHeroImages in src/supabase.ts: a JSON-array string or one URL.
create or replace function public.meta_first_image(p_raw text)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
declare
  v      text := btrim(coalesce(p_raw, ''));
  v_arr  jsonb;
  v_item text;
begin
  if v = '' then
    return null;
  end if;
  if left(v, 1) = '[' then
    begin
      v_arr := v::jsonb;
      if jsonb_typeof(v_arr) = 'array' then
        for v_item in select btrim(x) from jsonb_array_elements_text(v_arr) x loop
          if v_item <> '' then
            return v_item;
          end if;
        end loop;
        return null;
      end if;
    exception when others then
      null;  -- not valid JSON: fall through to a single URL, as parseHeroImages does
    end;
  end if;
  return v;
end;
$function$;

-- positiveNumber in src/eventPricing.ts: a JSON number or numeric string above 0,
-- anything else 0. CASE, not AND, so a non-numeric string is never cast.
create or replace function public.meta_positive_number(p jsonb)
returns numeric
language sql
immutable
set search_path to 'public'
as $function$
  select case jsonb_typeof(p)
    when 'number' then greatest((p::text)::numeric, 0)
    when 'string' then
      case when btrim(p #>> '{}') ~ '^[0-9]+(\.[0-9]+)?$' then (btrim(p #>> '{}'))::numeric else 0 end
    else 0
  end;
$function$;

-- resolveDefaultFullPrice in src/eventPricing.ts — keep the two in step. The first
-- configured city (never "Other") wins when its city_details price is positive;
-- otherwise the plan-level price_full; otherwise 0.
create or replace function public.meta_plan_price(p_cities jsonb, p_city_details jsonb, p_price_full integer)
returns numeric
language sql
immutable
set search_path to 'public'
as $function$
  with first_city as (
    select btrim(t.c #>> '{}') as city
      from jsonb_array_elements(case when jsonb_typeof(p_cities) = 'array' then p_cities else '[]'::jsonb end)
           with ordinality t(c, i)
     where jsonb_typeof(t.c) = 'string'
       and btrim(t.c #>> '{}') <> ''
       and lower(btrim(t.c #>> '{}')) <> 'other'
     order by t.i
     limit 1
  ),
  city_price as (
    select public.meta_positive_number(d.v->'priceFull')  as camel,
           public.meta_positive_number(d.v->'price_full') as snake
      from first_city fc,
           jsonb_each(case when jsonb_typeof(p_city_details) = 'object' then p_city_details else '{}'::jsonb end) d(k, v)
     where lower(d.k) = lower(fc.city)
     limit 1
  )
  select coalesce(
    (select case when camel > 0 then camel when snake > 0 then snake end from city_price),
    case when coalesce(p_price_full, 0) > 0 then p_price_full::numeric end,
    0);
$function$;

create or replace function public.meta_catalog_items()
returns table (
  id           text,
  title        text,
  description  text,
  price        numeric,
  image_url    text,
  image_source text,
  link         text,
  availability text,
  next_date    date,
  category     text,
  city         text,
  booking      text,
  payment_mode text,
  problems     text[],
  warnings     text[],
  feedable     boolean
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with
  clock as (select (now() at time zone 'Asia/Kolkata')::date as ist_today),
  plans as (
    select e.*,
      public.meta_plan_price(e.cities, e.city_details, e.price_full) as resolved_price,
      public.meta_first_image(e.hero_image) as hero,
      -- The site shows event_media when there is no hero; a video contributes its thumbnail.
      (select case when m.type = 'image' then nullif(btrim(m.url), '') else nullif(btrim(m.thumbnail_url), '') end
         from public.event_media m
        where m.event_id = e.id
          and nullif(btrim(case when m.type = 'image' then m.url else m.thumbnail_url end), '') is not null
        order by m.sort_order nulls last
        limit 1) as media_image,
      (select btrim(t.c #>> '{}')
         from jsonb_array_elements(case when jsonb_typeof(e.cities) = 'array' then e.cities else '[]'::jsonb end)
              with ordinality t(c, i)
        where jsonb_typeof(t.c) = 'string'
          and btrim(t.c #>> '{}') <> ''
          and lower(btrim(t.c #>> '{}')) <> 'other'
        order by t.i
        limit 1) as first_city
    from public.events e
    where e.is_active
      -- Community events book over WhatsApp and have nothing to sell.
      and e.booking_flow = 'payment'
  ),
  dates as (
    -- Seats per date exactly as the site counts them (AppFlow spotsLeftForBookingDate
    -- and event_booking_counts_by_date): total_capacity minus paid tickets on that
    -- date. NULL = no capacity limit.
    select p.id as plan_id, ed.start_date,
      case when coalesce(p.total_capacity, 0) > 0 then
        p.total_capacity - coalesce((
          select sum(a.ticket_count) from public.applications a
           where a.event_slug = p.slug
             and a.selected_date = ed.start_date::text
             and a.status in ('advance_paid','fully_paid')), 0)
      end as spots_left
    from plans p
    join public.event_dates ed on ed.event_id = p.id
    where ed.start_date >= (select ist_today from clock)
      and coalesce(ed.status, 'available') = 'available'
  ),
  shaped as (
    select p.*,
      coalesce(p.hero, p.media_image) as img,
      case when p.hero is not null then 'hero' when p.media_image is not null then 'media_thumbnail' end as img_source,
      (select min(x.start_date) from dates x
        where x.plan_id = p.id and (x.spots_left is null or x.spots_left > 0)) as open_date,
      exists (select 1 from dates x where x.plan_id = p.id) as has_upcoming,
      coalesce(nullif(btrim(p.one_liner), ''), nullif(btrim(p.description), '')) as descr,
      (coalesce(p.invite_only, false) or p.booking_url = 'native-application') as is_invite
    from plans p
  )
  select
    s.slug,
    left(btrim(s.title), 150),
    left(s.descr, 5000),
    s.resolved_price,
    s.img,
    s.img_source,
    'https://chaptera.in/?preview_event=' || s.slug,
    case when s.open_date is not null then 'in stock' else 'out of stock' end,
    s.open_date,
    s.category,
    s.first_city,
    case when s.is_invite then 'invite' else 'open' end,
    s.payment_mode,
    -- Blocking: Meta rejects the item, so it is left out of the feed.
    array_remove(array[
      case when s.resolved_price <= 0 then 'no_price' end,
      case when s.img is null then 'no_image' end,
      case when s.descr is null then 'no_description' end
    ], null),
    -- Not blocking the feed, but each one blocks advertising the plan well.
    array_remove(array[
      case when not s.has_upcoming then 'no_upcoming_date' end,
      case when s.has_upcoming and s.open_date is null then 'sold_out' end,
      case when s.img is not null and exists (
             select 1 from shaped o where o.slug <> s.slug and coalesce(o.hero, o.media_image) = s.img)
           then 'shared_image' end,
      case when s.is_invite then 'invite_only' end
    ], null),
    (s.resolved_price > 0 and s.img is not null and s.descr is not null)
  from shaped s
  order by (s.open_date is null), s.open_date, s.title;
$function$;

comment on function public.meta_catalog_items() is
  'Live bookable plans as a Meta catalog would see them (price, image, link, '
  'availability) with blocking problems and warnings. service_role only; read by '
  'meta-catalog-feed and get_meta_catalog_readiness.';

create or replace function public.get_meta_catalog_readiness()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case when public.is_admin_strict() then jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) - 'ordinality' order by i.ordinality)
        from public.meta_catalog_items() with ordinality i
    ), '[]'::jsonb),
    'feed_url', 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-catalog-feed'
  ) end;
$function$;

comment on function public.get_meta_catalog_readiness() is
  'Founder-gated: every live plan with what stops it being advertised. NULL for '
  'anyone who is not is_admin_strict().';

revoke all on function public.meta_first_image(text) from public, anon, authenticated;
revoke all on function public.meta_positive_number(jsonb) from public, anon, authenticated;
revoke all on function public.meta_plan_price(jsonb, jsonb, integer) from public, anon, authenticated;
revoke all on function public.meta_catalog_items() from public, anon, authenticated;
grant execute on function public.meta_first_image(text) to service_role;
grant execute on function public.meta_positive_number(jsonb) to service_role;
grant execute on function public.meta_plan_price(jsonb, jsonb, integer) to service_role;
grant execute on function public.meta_catalog_items() to service_role;

revoke all on function public.get_meta_catalog_readiness() from public, anon;
grant execute on function public.get_meta_catalog_readiness() to authenticated;
