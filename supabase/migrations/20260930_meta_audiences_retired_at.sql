-- 2026-09-30, owner: "do the retiring" (post-Andromeda audit, docs/FOUNDERS-MEET-ADS-PLAN.md).
-- meta-audience-sync uploads every row of meta_audiences. Retiring a list by
-- DELETING its row would also throw away its history (member_count, last sync,
-- the Meta id it had), so a list is retired by stamping retired_at instead and
-- the sync skips stamped rows. Un-retiring = set it back to NULL.
alter table public.meta_audiences add column if not exists retired_at timestamptz;

comment on column public.meta_audiences.retired_at is
  'When set, meta-audience-sync no longer uploads this list. The Meta-side audience is deleted separately (by hand / MCP); audience_id is kept as history.';

update public.meta_audiences
set retired_at = now(),
    description = coalesce(description, '') || ' RETIRED 2026-09-30: lookalikes and separate retargeting do not fit the post-Andromeda setup (creative is the targeting; pools too small). Meta-side audience deleted the same day.'
where key in ('customers_completed', 'leads_unpaid') and retired_at is null
returning key, retired_at;

-- Same session: the four DRAFT website audiences from §19 were retired too
-- (never created on Meta, so nothing Meta-side to delete). Applied via execute_sql.
update public.meta_website_audiences set status = 'retired'
where key in ('price_seen', 'dates_opened', 'plan_viewed', 'top_engaged')
  and status = 'draft' and audience_id is null;
