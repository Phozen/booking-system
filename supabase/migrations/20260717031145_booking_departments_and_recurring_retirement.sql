-- Department tags are operational metadata for a booking.  They are kept in
-- normalised tables so archived departments remain visible on historical work.
create table public.departments (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_name_not_blank check (char_length(trim(name)) > 0),
  constraint departments_email_not_blank check (char_length(trim(email)) > 0),
  constraint departments_name_unique unique (name),
  constraint departments_email_unique unique (email)
);

create table public.booking_departments (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (booking_id, department_id)
);

create index booking_departments_department_id_idx
  on public.booking_departments(department_id);

create trigger set_departments_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

alter table public.departments enable row level security;
alter table public.booking_departments enable row level security;

grant select on public.departments to authenticated;
grant select on public.booking_departments to authenticated;

create policy "Active users can view departments"
on public.departments for select to authenticated
using (public.is_active_user());

create policy "Super admins manage departments"
on public.departments for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Booking viewers can view booking departments"
on public.booking_departments for select to authenticated
using (
  public.is_active_user()
  and exists (
    select 1 from public.bookings b
    where b.id = booking_departments.booking_id
      and (
        b.user_id = auth.uid()
        or public.is_admin()
        or exists (
          select 1 from public.booking_invitations bi
          where bi.booking_id = b.id
            and bi.invited_user_id = auth.uid()
            and bi.status in ('pending', 'accepted', 'declined')
        )
      )
  )
);

-- A deliberately inactive record makes the new catalogue visible to Super
-- Admins without accidentally emitting mail before Qhazanah supplies mailboxes.
insert into public.departments (name, email, is_active)
values ('Placeholder Department', 'department@placeholder.invalid', false);

create or replace function public.set_booking_departments(
  p_booking_id uuid,
  p_department_ids uuid[] default array[]::uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_department_ids uuid[] := coalesce(p_department_ids, array[]::uuid[]);
begin
  if not public.is_active_user() then
    raise exception 'Only active users can update booking departments.';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Users can only update departments for their own bookings.';
  end if;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'This booking can no longer be edited.';
  end if;

  if cardinality(v_department_ids) <> cardinality(array(select distinct unnest(v_department_ids))) then
    raise exception 'A department may only be tagged once.';
  end if;

  if exists (
    select 1 from unnest(v_department_ids) as id
    left join public.departments d on d.id = id and d.is_active
    where d.id is null
  ) then
    raise exception 'Choose active departments only.';
  end if;

  delete from public.booking_departments where booking_id = p_booking_id;
  insert into public.booking_departments (booking_id, department_id)
  select p_booking_id, id from unnest(v_department_ids) as id;
end;
$$;

revoke all on function public.set_booking_departments(uuid, uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.set_booking_departments(uuid, uuid[]) to authenticated;

-- Keep normal booking creation as the authoritative validator, but make the
-- booking, its department tags, and initial internal invitations all-or-nothing.
create or replace function public.create_booking_with_participants(
  p_facility_id uuid,
  p_user_id uuid,
  p_created_by uuid,
  p_title text,
  p_description text,
  p_attendee_count integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_approval_required boolean,
  p_catering_required boolean default false,
  p_catering_type text default null,
  p_catering_pax integer default null,
  p_catering_serving_time text default null,
  p_catering_dietary_notes text default null,
  p_catering_notes text default null,
  p_department_ids uuid[] default array[]::uuid[],
  p_invited_user_ids uuid[] default array[]::uuid[]
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_departments uuid[] := coalesce(p_department_ids, array[]::uuid[]);
  v_invitees uuid[] := coalesce(p_invited_user_ids, array[]::uuid[]);
begin
  if cardinality(v_departments) <> cardinality(array(select distinct unnest(v_departments))) then
    raise exception 'A department may only be tagged once.';
  end if;
  if cardinality(v_invitees) <> cardinality(array(select distinct unnest(v_invitees))) then
    raise exception 'A user may only be invited once.';
  end if;
  if p_user_id = any(v_invitees) then
    raise exception 'The booking owner cannot be invited.';
  end if;
  if exists (
    select 1 from unnest(v_departments) as id
    left join public.departments d on d.id = id and d.is_active
    where d.id is null
  ) then
    raise exception 'Choose active departments only.';
  end if;
  if exists (
    select 1 from unnest(v_invitees) as id
    left join public.profiles p on p.id = id and p.status = 'active'
    where p.id is null
  ) then
    raise exception 'Choose active internal users only.';
  end if;

  select * into v_booking from public.create_booking(
    p_facility_id, p_user_id, p_created_by, p_title, p_description,
    p_attendee_count, p_starts_at, p_ends_at, p_approval_required,
    p_catering_required, p_catering_type, p_catering_pax,
    p_catering_serving_time, p_catering_dietary_notes, p_catering_notes
  );

  insert into public.booking_departments (booking_id, department_id)
  select v_booking.id, id from unnest(v_departments) as id;

  insert into public.booking_invitations (booking_id, invited_user_id, invited_by)
  select v_booking.id, id, auth.uid() from unnest(v_invitees) as id;

  return v_booking;
end;
$$;

revoke all on function public.create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, boolean, text, integer, text, text, text, uuid[], uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, boolean, text, integer, text, text, text, uuid[], uuid[]) to authenticated;

create or replace function public.admin_create_booking_with_participants(
  p_actor_user_id uuid, p_target_user_id uuid, p_facility_id uuid, p_title text,
  p_description text, p_attendee_count integer, p_starts_at timestamptz,
  p_ends_at timestamptz, p_approval_required boolean,
  p_department_ids uuid[] default array[]::uuid[], p_invited_user_ids uuid[] default array[]::uuid[]
)
returns public.bookings
language plpgsql security definer set search_path = public
as $$
declare v_booking public.bookings; v_departments uuid[] := coalesce(p_department_ids, array[]::uuid[]); v_invitees uuid[] := coalesce(p_invited_user_ids, array[]::uuid[]);
begin
  if not exists (select 1 from public.profiles where id = p_actor_user_id and role::text in ('admin','super_admin') and status = 'active') then raise exception 'Only active admins can create bookings for another user.'; end if;
  if cardinality(v_departments) <> cardinality(array(select distinct unnest(v_departments))) or cardinality(v_invitees) <> cardinality(array(select distinct unnest(v_invitees))) then raise exception 'Duplicate participants are not allowed.'; end if;
  if p_target_user_id = any(v_invitees) then raise exception 'The booking owner cannot be invited.'; end if;
  if exists (select 1 from unnest(v_departments) as id left join public.departments d on d.id=id and d.is_active where d.id is null) then raise exception 'Choose active departments only.'; end if;
  if exists (select 1 from unnest(v_invitees) as id left join public.profiles p on p.id=id and p.status='active' where p.id is null) then raise exception 'Choose active internal users only.'; end if;
  select * into v_booking from public.admin_create_booking(p_actor_user_id, p_target_user_id, p_facility_id, p_title, p_description, p_attendee_count, p_starts_at, p_ends_at, p_approval_required);
  insert into public.booking_departments (booking_id, department_id) select v_booking.id, id from unnest(v_departments) as id;
  insert into public.booking_invitations (booking_id, invited_user_id, invited_by) select v_booking.id, id, p_actor_user_id from unnest(v_invitees) as id;
  return v_booking;
end;
$$;
revoke all on function public.admin_create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, uuid[], uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.admin_create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, uuid[], uuid[]) to service_role;

-- Recurring booking is retired. Existing rows remain immutable audit records;
-- this function is the controlled one-time cancellation path for future work.
revoke execute on function public.create_recurring_booking_series(uuid, uuid, text, text, integer, boolean, text, integer, date, date, integer, jsonb) from authenticated;
revoke execute on function public.cancel_own_recurring_bookings(uuid, text) from authenticated;

create or replace function public.retire_future_recurring_bookings()
returns table (booking_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only active super admins can retire recurring bookings.';
  end if;

  perform set_config('booking_system.allow_booking_mutation', 'on', true);
  perform set_config('booking_system.allow_booking_approval_review', 'on', true);

  update public.booking_approvals ba
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
      remarks = 'Recurring bookings retired by Super Admin.'
  from public.bookings b
  where ba.booking_id = b.id and b.recurrence_series_id is not null
    and b.starts_at > now() and b.status = 'pending' and ba.status = 'pending';

  update public.booking_recurrence_series
  set status = 'cancelled', cancelled_by = auth.uid(), cancelled_at = now()
  where status = 'active';

  return query
  update public.bookings
  set status = 'cancelled', cancelled_by = auth.uid(), cancelled_at = now(),
      cancellation_reason = 'Recurring booking feature retired.'
  where recurrence_series_id is not null and starts_at > now()
    and status in ('pending', 'confirmed')
  returning id;

  perform set_config('booking_system.allow_booking_approval_review', 'off', true);
  perform set_config('booking_system.allow_booking_mutation', 'off', true);
exception when others then
  perform set_config('booking_system.allow_booking_approval_review', 'off', true);
  perform set_config('booking_system.allow_booking_mutation', 'off', true);
  raise;
end;
$$;

revoke all on function public.retire_future_recurring_bookings() from public, anon, authenticated, service_role;
grant execute on function public.retire_future_recurring_bookings() to authenticated;
