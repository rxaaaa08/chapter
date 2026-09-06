-- Custom Audiences built from our own customer records. Full rationale and the
-- membership function are applied on prod under the same name; this file is the
-- repo copy. See meta_audience_membership() for the three definitions.
--
--   customers_all_paid   — anyone who ever paid. EXCLUDE from prospecting:
--                          paying to re-acquire an existing customer is the
--                          most expensive click there is.
--   customers_completed  — fully_paid only. Lookalike seed. Meta wants ~100
--                          MATCHED people and we have 85, so this is created
--                          before it is usable and fills as people book.
--   leads_unpaid         — applied, never paid, not rejected, AND has never
--                          paid for any other event. That last clause is why
--                          this is 165 rather than 184: somebody mid-booking
--                          today who bought a trip in August is a customer,
--                          not a cold lead.
--
-- Membership keys on phone because that is this system's person key — the
-- applications unique key is (event_slug, phone) and phone is what CAPI hashes
-- into external_id. Keying on anything else splits one person into two.
--
-- meta_audience_members exists so each run sends only the DIFFERENCE. Meta's
-- /users edge adds and dedupes, so re-uploading everyone daily would "work" —
-- and would never remove anybody, leaving a lead who finally paid inside the
-- retargeting audience forever.
create table if not exists public.meta_audiences (
  key            text primary key,
  name           text not null,
  description    text,
  audience_id    text unique,
  member_count   integer not null default 0,
  last_synced_at timestamptz,
  last_error     text,
  created_at     timestamptz not null default now()
);

create table if not exists public.meta_audience_members (
  audience_key text not null references public.meta_audiences(key) on delete cascade,
  phone        text not null,
  added_at     timestamptz not null default now(),
  removed_at   timestamptz,
  primary key (audience_key, phone)
);

create index if not exists meta_audience_members_active_idx
  on public.meta_audience_members (audience_key) where removed_at is null;

alter table public.meta_audiences enable row level security;
alter table public.meta_audience_members enable row level security;

drop policy if exists meta_audiences_founder_read on public.meta_audiences;
create policy meta_audiences_founder_read on public.meta_audiences
  for select to authenticated using (public.is_admin_strict());

drop policy if exists meta_audience_members_founder_read on public.meta_audience_members;
create policy meta_audience_members_founder_read on public.meta_audience_members
  for select to authenticated using (public.is_admin_strict());

revoke insert, update, delete on public.meta_audiences from anon, authenticated;
revoke insert, update, delete on public.meta_audience_members from anon, authenticated;

insert into public.meta_audiences (key, name, description) values
  ('customers_all_paid',  'chapter அ · customers (any payment)',
   'Anyone who has ever paid us, advance or full. Use as an EXCLUSION on prospecting campaigns.'),
  ('customers_completed', 'chapter அ · customers (fully paid)',
   'Fully paid customers only. Seed for lookalike audiences.'),
  ('leads_unpaid',        'chapter அ · leads (never paid)',
   'Applied but never paid and not rejected, and who have never paid for any other event. Retargeting.')
on conflict (key) do nothing;

create or replace function public.meta_audience_membership(p_key text)
returns table (phone text, email text, name text, city text)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with paid as (
    select distinct a.phone from public.applications a
    where a.status in ('advance_paid','fully_paid')
  )
  select a.phone,
         max(a.email)          as email,
         max(a.name)           as name,
         max(a.selected_city)  as city
  from public.applications a
  where a.phone is not null
    and length(a.phone) = 10
    -- Never send our own test bookings to Meta. Same 90000000xx convention the
    -- CAPI guard uses (CLAUDE.md).
    and a.phone not like '90000000%'
    and (
      (p_key = 'customers_all_paid'  and a.status in ('advance_paid','fully_paid'))
      or (p_key = 'customers_completed' and a.status = 'fully_paid')
      or (p_key = 'leads_unpaid'
          and a.status not in ('advance_paid','fully_paid','rejected')
          and a.phone not in (select phone from paid))
    )
  group by a.phone;
$function$;

revoke all on function public.meta_audience_membership(text) from public, anon, authenticated;

-- Document why this function is protected differently from its neighbours.
--
-- get_meta_ads_performance and get_meta_recommendation_scorecard both wrap their
-- output in `case when public.is_admin_strict() then ... end`, so a non-founder
-- gets NULL. This one does NOT, and cannot: meta-audience-sync calls it AS THE
-- SERVICE ROLE, for which is_admin_strict() is false, so the usual gate would
-- break the audience sync rather than protect anything.
--
-- Its only defence is therefore the REVOKE: EXECUTE is granted to service_role
-- alone. That is one mechanism where the others have two, and it returns raw
-- customer PII — phone, email, name, city — to anyone who holds it.
--
-- NEVER grant this to `authenticated`. Doing so while wiring up some future panel
-- feature would expose every customer's contact details with no second line of
-- defence, and nothing in the function body would stop it.
comment on function public.meta_audience_membership(text) is
  'Returns raw customer PII (phone, email, name, city) for one Custom Audience. SERVICE ROLE ONLY — protected solely by the EXECUTE grant, with NO internal is_admin_strict() check, because meta-audience-sync calls it as the service role and that gate would return false. Never grant to authenticated.';
