-- Unified customer analytics, phase 1 of 8: ground.
--
-- Design:    docs/UNIFIED-CUSTOMER-ANALYTICS-PROPOSAL-v2-2026-10-11.md
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md
--
-- Nothing here changes what a customer sees or what is recorded today. It only
-- makes room:
--   1. a schema the website's API cannot reach, for everything that follows;
--   2. six empty columns on flow_analytics, with a guard on what may go in them;
--   3. two empty columns each on the booking-code and booking tables, to hold
--      the visit an attempt was made in.
--
-- Additive only. Every new column is nullable with no default, so existing
-- inserts are untouched, and the guard trigger does not even fire for a row
-- that leaves the new columns empty.

-- ── 1. A private schema ──────────────────────────────────────────────────────
--
-- WHY NOT `public`: in this database anything new in `public` is granted to
-- anon and authenticated by default (pg_default_acl, read 2026-10-11), and a
-- view there reads straight past row-level security unless it is created with
-- security_invoker. `application_history` is safe only because it has that
-- option. A schema the API does not expose, with no USAGE for the client roles,
-- removes the whole class of mistake: a table or view placed here cannot be
-- reached from a browser whatever its own grants say.
create schema if not exists analytics;
revoke all on schema analytics from public, anon, authenticated;

comment on schema analytics is
  'Unified customer analytics. Not exposed by the API and no USAGE for anon/authenticated, on purpose: see 20261011_unified_analytics_1_ground.sql. Reached only through SECURITY DEFINER functions in public that check is_admin_strict().';

-- ── 2. Room on flow_analytics ────────────────────────────────────────────────
alter table public.flow_analytics
  add column if not exists event_uid uuid,
  add column if not exists schema_v  smallint,
  add column if not exists client_ts timestamptz,
  add column if not exists page      text,
  add column if not exists context   jsonb,
  add column if not exists props     jsonb;

comment on column public.flow_analytics.event_uid is
  'The step''s own id, minted by the browser. A retry reuses it, so the unique index turns a resend into a no-op instead of a second row.';
comment on column public.flow_analytics.schema_v is
  'Version of the shape the browser sent. NULL on every row before the page-name capture went live.';
comment on column public.flow_analytics.client_ts is
  'The phone''s own clock when the step happened. created_at is when the server received it; the two differ on a slow connection, and only this one orders steps inside a visit truthfully.';
comment on column public.flow_analytics.page is
  'A page NAME from a fixed list (lifestyle, plans, plan, invite …), never an address: an address can carry a phone number, a name or a link code.';
comment on column public.flow_analytics.context is
  'Starting context, sent on each landing: landing_page, ref_host, browser, device, storage (local|session|memory: how the browser id is being kept, which decides whether it can link two visits), internal, app_v. Anything else is dropped by flow_row_guard().';
comment on column public.flow_analytics.props is
  'Small details of a step, limited to fixed keys whose values are short codes, never typed text: field, error, reason, step, from_page, to_page, button, n, ok. Anything else is dropped by flow_row_guard().';

create unique index if not exists flow_analytics_event_uid_key
  on public.flow_analytics (event_uid)
  where event_uid is not null;

-- Reading one visit's steps in order is what every later phase does.
create index if not exists flow_analytics_session_created_idx
  on public.flow_analytics (session_id, created_at);

-- The guard.
--
-- flow_analytics is written by anon, straight from the browser, so the browser
-- cannot be trusted to send only what it should. This keeps the promise of
-- proposal section 5.4 in the one place that cannot be skipped: only names from
-- fixed lists and short codes get stored. A value that is not a code is DROPPED,
-- not rejected, so a bug in the new fields can never cost the step itself.
--
-- A "code" is lowercase letters, digits and underscores, at most 40 long. That
-- is loose enough that a new error code needs no migration and tight enough
-- that nothing a person typed (a name, a number with spaces, a sentence, an
-- address) can pass.
create or replace function analytics.flow_row_guard()
returns trigger
language plpgsql
set search_path = pg_catalog
as $fn$
declare
  code constant text := '^[a-z0-9_]{1,40}$';
  src  jsonb;
  kept jsonb;
  k    text;
begin
  begin
    if new.page is not null and new.page !~ code then
      new.page := null;
    end if;
    if new.schema_v is not null and (new.schema_v < 1 or new.schema_v > 999) then
      new.schema_v := null;
    end if;
    -- A phone's clock can be wrong by years. Past two days either way it says
    -- nothing useful about order, so it is not kept.
    if new.client_ts is not null
       and (new.client_ts < now() - interval '2 days' or new.client_ts > now() + interval '2 days') then
      new.client_ts := null;
    end if;

    if new.context is not null then
      if jsonb_typeof(new.context) <> 'object' then
        new.context := null;
      else
        src  := new.context;
        kept := '{}'::jsonb;
        foreach k in array array['landing_page', 'browser', 'device'] loop
          if jsonb_typeof(src -> k) = 'string' and (src ->> k) ~ code then
            kept := kept || jsonb_build_object(k, src ->> k);
          end if;
        end loop;
        if (src ->> 'storage') in ('local', 'session', 'memory') then
          kept := kept || jsonb_build_object('storage', src ->> 'storage');
        end if;
        -- A host name only: never a path or a query, which is where personal
        -- details travel.
        if jsonb_typeof(src -> 'ref_host') = 'string' and (src ->> 'ref_host') ~ '^[a-z0-9.-]{1,100}$' then
          kept := kept || jsonb_build_object('ref_host', src ->> 'ref_host');
        end if;
        if jsonb_typeof(src -> 'app_v') = 'string' and (src ->> 'app_v') ~ '^[A-Za-z0-9._-]{1,40}$' then
          kept := kept || jsonb_build_object('app_v', src ->> 'app_v');
        end if;
        if jsonb_typeof(src -> 'internal') = 'boolean' then
          kept := kept || jsonb_build_object('internal', (src -> 'internal'));
        end if;
        new.context := nullif(kept, '{}'::jsonb);
      end if;
    end if;

    if new.props is not null then
      if jsonb_typeof(new.props) <> 'object' then
        new.props := null;
      else
        src  := new.props;
        kept := '{}'::jsonb;
        foreach k in array array['field', 'error', 'reason', 'step', 'from_page', 'to_page', 'button'] loop
          if jsonb_typeof(src -> k) = 'string' and (src ->> k) ~ code then
            kept := kept || jsonb_build_object(k, src ->> k);
          end if;
        end loop;
        if jsonb_typeof(src -> 'n') = 'number' and (src ->> 'n') ~ '^[0-9]{1,5}$' then
          kept := kept || jsonb_build_object('n', (src ->> 'n')::int);
        end if;
        if jsonb_typeof(src -> 'ok') = 'boolean' then
          kept := kept || jsonb_build_object('ok', (src -> 'ok'));
        end if;
        new.props := nullif(kept, '{}'::jsonb);
      end if;
    end if;
  exception when others then
    -- The step matters more than its extras.
    new.page := null; new.context := null; new.props := null;
    new.schema_v := null; new.client_ts := null;
  end;
  return new;
end;
$fn$;

revoke all on function analytics.flow_row_guard() from public, anon, authenticated;

drop trigger if exists trg_flow_row_guard on public.flow_analytics;
create trigger trg_flow_row_guard
  before insert on public.flow_analytics
  for each row
  when (new.page is not null or new.context is not null or new.props is not null
        or new.schema_v is not null or new.client_ts is not null)
  execute function analytics.flow_row_guard();

-- ── 3. The direct link: which visit an attempt was made in ───────────────────
--
-- "This booking was made in this visit" becomes a stored fact, not something
-- worked out afterwards. It is the backbone of proposal section 7.2.
--
-- TEXT, not uuid, and no CHECK: applications is written by the browser and
-- open_event_otp_sessions gates every open-event sale, so a malformed id must
-- never be able to fail the insert. A value that is not a well-formed id is
-- ignored at reading time instead.
alter table public.open_event_otp_sessions
  add column if not exists session_id text,
  add column if not exists visitor_id text;

alter table public.applications
  add column if not exists first_session_id text,
  add column if not exists first_visitor_id text;

comment on column public.open_event_otp_sessions.session_id is
  'The website visit (ca_session_id) this code was asked for in. NULL before the site began sending it. Analytics only: it grants nothing.';
comment on column public.open_event_otp_sessions.visitor_id is
  'The browser (ca_visitor_id) this code was asked for in. Analytics only.';
comment on column public.applications.first_session_id is
  'The website visit in which this booking row was first created. Never updated afterwards: a returning lead hits the (event_slug, phone) key and keeps the original. Analytics only.';
comment on column public.applications.first_visitor_id is
  'The browser in which this booking row was first created. Analytics only.';
