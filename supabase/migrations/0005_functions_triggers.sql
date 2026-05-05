create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_profile_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    if new.email is distinct from old.email
      or new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.last_login_at is distinct from old.last_login_at
    then
      raise exception 'Users cannot update protected profile fields.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_self_privilege_escalation on public.profiles;
create trigger prevent_profile_self_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_self_privilege_escalation();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_facilities_updated_at on public.facilities;
create trigger set_facilities_updated_at
before update on public.facilities
for each row execute function public.set_updated_at();

drop trigger if exists set_facility_photos_updated_at on public.facility_photos;
create trigger set_facility_photos_updated_at
before update on public.facility_photos
for each row execute function public.set_updated_at();

drop trigger if exists set_equipment_updated_at on public.equipment;
create trigger set_equipment_updated_at
before update on public.equipment
for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create or replace function public.prevent_unsafe_user_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.user_id and not public.is_admin() then
    if old.status not in ('pending', 'confirmed') or new.status <> 'cancelled' then
      raise exception 'Users can only cancel their own active bookings.';
    end if;

    if new.facility_id is distinct from old.facility_id
      or new.user_id is distinct from old.user_id
      or new.created_by is distinct from old.created_by
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.attendee_count is distinct from old.attendee_count
      or new.starts_at is distinct from old.starts_at
      or new.ends_at is distinct from old.ends_at
      or new.approval_required is distinct from old.approval_required
      or new.completed_at is distinct from old.completed_at
      or new.metadata is distinct from old.metadata
    then
      raise exception 'Users cannot edit booking details during cancellation.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_unsafe_user_booking_update on public.bookings;
create trigger prevent_unsafe_user_booking_update
before update on public.bookings
for each row execute function public.prevent_unsafe_user_booking_update();

drop trigger if exists set_booking_approvals_updated_at on public.booking_approvals;
create trigger set_booking_approvals_updated_at
before update on public.booking_approvals
for each row execute function public.set_updated_at();

drop trigger if exists set_blocked_periods_updated_at on public.blocked_periods;
create trigger set_blocked_periods_updated_at
before update on public.blocked_periods
for each row execute function public.set_updated_at();

drop trigger if exists set_maintenance_closures_updated_at on public.maintenance_closures;
create trigger set_maintenance_closures_updated_at
before update on public.maintenance_closures
for each row execute function public.set_updated_at();

drop trigger if exists set_email_notifications_updated_at on public.email_notifications;
create trigger set_email_notifications_updated_at
before update on public.email_notifications
for each row execute function public.set_updated_at();

drop trigger if exists set_system_settings_updated_at on public.system_settings;
create trigger set_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'employee',
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.create_booking(
  p_facility_id uuid,
  p_user_id uuid,
  p_created_by uuid,
  p_title text,
  p_description text,
  p_attendee_count integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_approval_required boolean
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_facility public.facilities;
  v_booking public.bookings;
  v_status public.booking_status;
begin
  if not public.is_active_user() then
    raise exception 'Only active users can create bookings.';
  end if;

  if p_user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Users cannot create bookings for another user.';
  end if;

  if p_created_by is not null and p_created_by <> auth.uid() then
    raise exception 'Booking creator must match the authenticated user.';
  end if;

  if p_starts_at >= p_ends_at then
    raise exception 'Booking start time must be before end time.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_user_id
      and status = 'active'
  ) then
    raise exception 'Booking user is not active.';
  end if;

  select *
  into v_facility
  from public.facilities
  where id = p_facility_id;

  if not found then
    raise exception 'Facility not found.';
  end if;

  if v_facility.status <> 'active' or v_facility.is_archived = true then
    raise exception 'Facility is not available for booking.';
  end if;

  if p_attendee_count is not null and p_attendee_count > v_facility.capacity then
    raise exception 'Attendee count exceeds facility capacity.';
  end if;

  if exists (
    select 1
    from public.blocked_periods bp
    left join public.blocked_period_facilities bpf
      on bpf.blocked_period_id = bp.id
    where bp.is_active = true
      and bp.time_range && tstzrange(p_starts_at, p_ends_at, '[)')
      and (
        bp.scope = 'all_facilities'
        or bpf.facility_id = p_facility_id
      )
  ) then
    raise exception 'Facility is blocked for the selected time.';
  end if;

  if exists (
    select 1
    from public.maintenance_closures mc
    where mc.facility_id = p_facility_id
      and mc.status in ('scheduled', 'in_progress')
      and mc.time_range && tstzrange(p_starts_at, p_ends_at, '[)')
  ) then
    raise exception 'Facility is under maintenance for the selected time.';
  end if;

  if p_approval_required then
    v_status := 'pending';
  else
    v_status := 'confirmed';
  end if;

  insert into public.bookings (
    facility_id,
    user_id,
    created_by,
    title,
    description,
    attendee_count,
    status,
    starts_at,
    ends_at,
    approval_required
  )
  values (
    p_facility_id,
    p_user_id,
    coalesce(p_created_by, auth.uid()),
    p_title,
    p_description,
    p_attendee_count,
    v_status,
    p_starts_at,
    p_ends_at,
    p_approval_required
  )
  returning *
  into v_booking;

  if p_approval_required then
    insert into public.booking_approvals (
      booking_id,
      status,
      requested_by
    )
    values (
      v_booking.id,
      'pending',
      p_user_id
    );
  end if;

  return v_booking;
end;
$$;

revoke all on function public.create_booking(
  uuid,
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz,
  boolean
) from public;

grant execute on function public.create_booking(
  uuid,
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz,
  boolean
) to authenticated;
