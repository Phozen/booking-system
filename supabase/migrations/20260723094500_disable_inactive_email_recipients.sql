-- A pending user state has no workflow in the Microsoft pre-provisioning model.
-- Existing pending access is conservatively converted to disabled access.
drop function if exists public.update_approved_user_access(
  uuid,
  public.user_role,
  public.user_status
);

update public.profiles
set status = 'disabled'
where status = 'pending';

update public.approved_users
set status = 'disabled'
where status = 'pending';

-- This policy's active-status comparison is typed against user_status, so it
-- must be recreated around the enum replacement below.
drop policy if exists "Booking owners can invite active users"
on public.booking_invitations;

create type public.user_status_next as enum ('active', 'disabled');

alter table public.profiles
  alter column status drop default,
  alter column status type public.user_status_next
    using status::text::public.user_status_next,
  alter column status set default 'active';

alter table public.approved_users
  alter column status drop default,
  alter column status type public.user_status_next
    using status::text::public.user_status_next,
  alter column status set default 'active';

drop type public.user_status;
alter type public.user_status_next rename to user_status;

create policy "Booking owners can invite active users"
on public.booking_invitations
for insert
with check (
  public.is_active_user()
  and invited_by = auth.uid()
  and exists (
    select 1
    from public.bookings b
    where b.id = booking_invitations.booking_id
      and b.user_id = auth.uid()
      and b.user_id <> booking_invitations.invited_user_id
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = booking_invitations.invited_user_id
      and p.status = 'active'
  )
);

create function public.update_approved_user_access(
  p_approved_user_id uuid,
  p_role public.user_role,
  p_status public.user_status
)
returns public.approved_users
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_existing public.approved_users;
  v_updated public.approved_users;
begin
  if not public.is_super_admin() then
    raise exception 'Only an active Super Admin can change approved access.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('qbook-active-super-admin', 0));

  select *
  into v_existing
  from public.approved_users
  where id = p_approved_user_id
  for update;

  if not found then
    raise exception 'Approved user not found.' using errcode = 'P0002';
  end if;

  if v_existing.role::text = 'super_admin'
    and v_existing.status = 'active'
    and (p_role::text <> 'super_admin' or p_status <> 'active')
    and not exists (
      select 1
      from public.approved_users au
      where au.id <> v_existing.id
        and au.role::text = 'super_admin'
        and au.status = 'active'
    )
  then
    raise exception 'Cannot remove the final active Super Admin.'
      using errcode = '23514';
  end if;

  update public.approved_users
  set
    role = p_role,
    status = p_status,
    updated_by = auth.uid()
  where id = p_approved_user_id
  returning * into v_updated;

  return v_updated;
end;
$$;

revoke execute on function public.update_approved_user_access(
  uuid,
  public.user_role,
  public.user_status
) from public, anon;

grant execute on function public.update_approved_user_access(
  uuid,
  public.user_role,
  public.user_status
) to authenticated;

-- This is invoked immediately after an email is claimed and before the provider
-- is called, so disabling a user also blocks messages that were already queued.
create or replace function public.cancel_email_notification_for_inactive_recipient(
  p_email_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification public.email_notifications;
  v_is_inactive boolean := false;
begin
  select *
  into v_notification
  from public.email_notifications
  where id = p_email_id
    and status = 'sending'
  for update;

  if not found or v_notification.recipient_user_id is null then
    return false;
  end if;

  select
    p.status <> 'active'
    or exists (
      select 1
      from public.approved_users au
      where au.normalized_email = lower(btrim(p.email))
        and au.status <> 'active'
    )
  into v_is_inactive
  from public.profiles p
  where p.id = v_notification.recipient_user_id;

  if coalesce(v_is_inactive, false) then
    update public.email_notifications
    set
      status = 'cancelled',
      sending_started_at = null,
      last_error = 'Email cancelled because the recipient account is disabled.',
      updated_at = now()
    where id = v_notification.id
      and status = 'sending';

    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.cancel_email_notification_for_inactive_recipient(uuid)
from public, anon, authenticated;

grant execute on function public.cancel_email_notification_for_inactive_recipient(uuid)
to service_role;
