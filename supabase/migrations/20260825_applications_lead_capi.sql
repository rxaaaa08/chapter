-- Server-side Lead reporting: the two columns a backstop needs.
--
-- WHY
-- Invite-only campaigns are optimised on Lead, so a lost Lead is a lost
-- conversion signal, not just a lost report. The browser is the only thing that
-- triggers the Lead today: if that call dies (tab closed, connection dropped,
-- function cold-start timeout) the application exists and Meta never hears about
-- it. Unlike Purchase there is no third party to webhook us, so the backstop has
-- to work off our own row.
--
-- lead_id        the dedup key the BROWSER generated and sent to Meta as eventID.
--                Stored so a later retry reports the SAME id — a freshly minted
--                one would collide with nothing and count the application twice.
--                NULL on rows not created by the customer-facing form (admin or
--                marketer entries), which is exactly what keeps those out of the
--                ad dataset.
-- lead_reported_at  set once the Conversions API has accepted the Lead. NULL
--                means "still owed", which is the sweeper's whole query.
--
-- Both nullable and additive: existing rows and every current code path are
-- unaffected. This must be applied BEFORE the frontend ships — the client puts
-- lead_id in its INSERT, and a missing column would 500 every invite booking.
alter table public.applications
  add column if not exists lead_id text,
  add column if not exists lead_reported_at timestamptz;

-- The sweeper's access path: unreported leads, newest first. Partial so the
-- index stays tiny — rows leave it permanently once reported.
create index if not exists applications_lead_pending_idx
  on public.applications (created_at)
  where lead_id is not null and lead_reported_at is null;

-- Added 2026-08-25, second pass: what the SWEEP needs to send a valid event.
--
-- Meta's Conversions API best-practices page lists client_user_agent as REQUIRED
-- for every website event, alongside action_source and event_source_url. The
-- browser path reads it from the request headers, but the sweep has no request
-- to read — it runs from pg_cron long after that browser is gone. Without these
-- it would report Leads missing a required parameter.
--
-- Captured client-side at insert, which is the one moment they exist. Unlike
-- create-payu-order there is no edge function in this path to read real headers
-- from: the applications INSERT goes straight to PostgREST. A spoofed user agent
-- would only degrade that person's own match, and the "row must exist" guard
-- already bounds who can write here at all.
--
-- lead_fbp / lead_fbc are a bonus rather than a requirement: they turn a
-- sweep-recovered Lead from a weak match into very nearly what the live path
-- sends. Deliberately separate columns, NOT folded into the attribution JSONB —
-- that column means traffic SOURCE, where null reads as direct/organic, and
-- _fbp exists for nearly every unblocked visitor, so writing it there would make
-- every organic application look ad-attributed.
alter table public.applications
  add column if not exists lead_user_agent text,
  add column if not exists lead_fbp text,
  add column if not exists lead_fbc text;
