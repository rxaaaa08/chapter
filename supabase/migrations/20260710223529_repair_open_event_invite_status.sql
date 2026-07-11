-- Open events have no approval/re-target stage. Older Admin Doubts actions
-- incorrectly treated these leads as invite-only: status='invited', an
-- invited_numbers whitelist row, and invite delivery fields that later made
-- retarget-check flag them. Normalize every affected open-event lead back to
-- the canonical unpaid state used by /plans.

alter table public.doubt_submissions
  add column if not exists open_details_sent_at timestamptz;

-- The admin/assigned marketer who can see a doubt may stamp successful
-- open-event details delivery. Public form users retain INSERT-only access.
drop policy if exists doubt_submissions_admin_update on public.doubt_submissions;
create policy doubt_submissions_admin_update
  on public.doubt_submissions for update to authenticated
  using (is_admin_only())
  with check (is_admin_only());

drop policy if exists doubt_submissions_marketer_update on public.doubt_submissions;
create policy doubt_submissions_marketer_update
  on public.doubt_submissions for update to authenticated
  using (
    current_marketer_id() is not null
    and assigned_marketer_id = current_marketer_id()
  )
  with check (
    current_marketer_id() is not null
    and assigned_marketer_id = current_marketer_id()
  );

update public.applications as a
set
  status = 'pending',
  re_target = false,
  aisensy_invite_sent = false,
  invite_sent_at = null,
  email_invite_sent = false,
  email_invite_sent_at = null
from public.events as e
where e.slug = a.event_slug
  and e.booking_url = 'payu-hosted'
  and a.status = 'invited';

-- Open-event access is application-backed and never needs invite whitelisting.
delete from public.invited_numbers as i
using public.events as e
where e.booking_url = 'payu-hosted'
  and e.invite_slug is not null
  and i.event_slug = e.invite_slug;
