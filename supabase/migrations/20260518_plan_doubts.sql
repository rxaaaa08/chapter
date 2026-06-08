-- ─── PLAN DOUBTS ──────────────────────────────────────────────────────────────
-- User-submitted questions/doubts from the /myplans page.
-- Surfaced in Admin People tab → Call mode for outreach follow-up.

create table if not exists plan_doubts (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null,
  event_slug   text not null,
  message      text not null,
  status       text not null default 'new', -- new | replied | closed
  created_at   timestamptz not null default now()
);

create index if not exists idx_plan_doubts_phone      on plan_doubts(phone);
create index if not exists idx_plan_doubts_event_slug on plan_doubts(event_slug);
create index if not exists idx_plan_doubts_created    on plan_doubts(created_at desc);

-- RLS: anon can insert, only admin can read/update.
alter table plan_doubts enable row level security;

create policy "anon can insert doubts"
  on plan_doubts for insert
  to anon
  with check (true);

create policy "service role full access"
  on plan_doubts for all
  to service_role
  using (true);
