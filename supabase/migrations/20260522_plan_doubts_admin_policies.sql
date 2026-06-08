-- Allow invite-chat doubts to save even when the browser has an authenticated
-- admin/operator session, and allow authenticated admin clients to read them.
-- The original policy only allowed inserts for anon, which makes local/admin
-- testing fail silently unless the UI checks the insert error.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_doubts'
      and policyname = 'authenticated can insert doubts'
  ) then
    create policy "authenticated can insert doubts"
      on plan_doubts for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_doubts'
      and policyname = 'authenticated can read doubts'
  ) then
    create policy "authenticated can read doubts"
      on plan_doubts for select
      to authenticated
      using (true);
  end if;
end $$;
