-- Booking mutation RPCs for safe edit, admin-created booking, and recurring
-- series creation. Direct employee updates to public.bookings remain limited
-- to cancellation by the public.prevent_unsafe_user_booking_update() trigger
-- and the existing RLS policy.

create unique index if not exists bookings_recurrence_series_sequence_idx
on public.bookings(recurrence_series_id, recurrence_sequence)
where recurrence_series_id is not null;

create or replace function public.prevent_unsafe_user_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only trusted SECURITY DEFINER booking mutation RPCs set this local flag.
  -- Normal client-side table updates cannot use it, so employee direct updates
  -- remain cancellation-only.
  if current_setting('booking_system.allow_booking_mutation', true) = 'on' then
    return new;
  end if;

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

create or replace function public.validate_booking_mutation_input(
  p_facility_id uuid,
  p_user_id uuid,
  p_attendee_count integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_catering_required boolean default false,
  p_catering_type text default null,
  p_catering_pax integer default null,
  p_catering_serving_time text default null
)
returns public.facilities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_facility public.facilities;
begin
  if p_starts_at is null or p_ends_at is null then
    raise exception 'Booking start and end time are required.';
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

  if p_attendee_count is not null and p_attendee_count < 0 then
    raise exception 'Attendee count cannot be negative.';
  end if;

  if p_attendee_count is not null and p_attendee_count > v_facility.capacity then
    raise exception 'Attendee count exceeds facility capacity.';
  end if;

  if coalesce(p_catering_required, false) = true then
    if p_catering_type is null or p_catering_serving_time is null then
      raise exception 'Catering type and serving time are required.';
    end if;

    if p_catering_pax is null or p_catering_pax <= 0 then
      raise exception 'Catering pax must be greater than zero.';
    end if;
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

  return v_facility;
end;
$$;

revoke all on function public.validate_booking_mutation_input(
  uuid,
  uuid,
  integer,
  timestamptz,
  timestamptz,
  boolean,
  text,
  integer,
  text
) from public, anon, authenticated, service_role;

create or replace function public.update_own_booking(
  p_booking_id uuid,
  p_facility_id uuid,
  p_title text,
  p_description text,
  p_attendee_count integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_updated public.bookings;
begin
  if not public.is_active_user() then
    raise exception 'Only active users can update bookings.';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.user_id <> auth.uid() then
    raise exception 'Users can only update their own bookings.';
  end if;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'This booking can no longer be edited.';
  end if;

  perform public.validate_booking_mutation_input(
    p_facility_id,
    auth.uid(),
    p_attendee_count,
    p_starts_at,
    p_ends_at
  );

  perform set_config('booking_system.allow_booking_mutation', 'on', true);

  update public.bookings
  set
    facility_id = p_facility_id,
    title = p_title,
    description = nullif(trim(p_description), ''),
    attendee_count = p_attendee_count,
    starts_at = p_starts_at,
    ends_at = p_ends_at
  where id = p_booking_id
    and user_id = auth.uid()
    and status in ('pending', 'confirmed')
  returning *
  into v_updated;

  perform set_config('booking_system.allow_booking_mutation', 'off', true);

  if v_updated.id is null then
    raise exception 'Booking could not be updated.';
  end if;

  return v_updated;
exception
  when others then
    perform set_config('booking_system.allow_booking_mutation', 'off', true);
    raise;
end;
$$;

revoke all on function public.update_own_booking(
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) from public, anon, authenticated, service_role;

grant execute on function public.update_own_booking(
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) to authenticated;

create or replace function public.admin_create_booking(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_facility_id uuid,
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
  p_catering_notes text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_status public.booking_status;
begin
  if not exists (
    select 1
    from public.profiles
    where id = p_actor_user_id
      and role::text in ('admin', 'super_admin')
      and status = 'active'
  ) then
    raise exception 'Only active admins can create bookings for another user.';
  end if;

  perform public.validate_booking_mutation_input(
    p_facility_id,
    p_target_user_id,
    p_attendee_count,
    p_starts_at,
    p_ends_at,
    p_catering_required,
    p_catering_type,
    p_catering_pax,
    p_catering_serving_time
  );

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
    approval_required,
    catering_required,
    catering_type,
    catering_pax,
    catering_serving_time,
    catering_dietary_notes,
    catering_notes
  )
  values (
    p_facility_id,
    p_target_user_id,
    p_actor_user_id,
    p_title,
    nullif(trim(p_description), ''),
    p_attendee_count,
    v_status,
    p_starts_at,
    p_ends_at,
    p_approval_required,
    coalesce(p_catering_required, false),
    case when coalesce(p_catering_required, false) then p_catering_type else null end,
    case when coalesce(p_catering_required, false) then p_catering_pax else null end,
    case when coalesce(p_catering_required, false) then p_catering_serving_time else null end,
    case when coalesce(p_catering_required, false) then nullif(trim(p_catering_dietary_notes), '') else null end,
    case when coalesce(p_catering_required, false) then nullif(trim(p_catering_notes), '') else null end
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
      p_target_user_id
    );
  end if;

  return v_booking;
end;
$$;

revoke all on function public.admin_create_booking(
  uuid,
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz,
  boolean,
  boolean,
  text,
  integer,
  text,
  text,
  text
) from public, anon, authenticated, service_role;

grant execute on function public.admin_create_booking(
  uuid,
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz,
  boolean,
  boolean,
  text,
  integer,
  text,
  text,
  text
) to service_role;

create or replace function public.create_recurring_booking_series(
  p_owner_user_id uuid,
  p_facility_id uuid,
  p_title text,
  p_description text,
  p_attendee_count integer,
  p_approval_required boolean,
  p_frequency text,
  p_interval_count integer,
  p_starts_on date,
  p_ends_on date,
  p_occurrence_count integer,
  p_occurrences jsonb
)
returns table (
  series_id uuid,
  booking_id uuid,
  recurrence_sequence integer,
  status public.booking_status,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_series_id uuid;
  v_occurrence jsonb;
  v_sequence integer;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_booking public.bookings;
  v_status public.booking_status;
  v_occurrence_total integer;
begin
  if not public.is_active_user() then
    raise exception 'Only active users can create recurring bookings.';
  end if;

  if p_owner_user_id <> auth.uid() then
    raise exception 'Users can only create recurring bookings for themselves.';
  end if;

  if p_frequency not in ('daily', 'weekly', 'monthly') then
    raise exception 'Recurring booking frequency is invalid.';
  end if;

  if p_interval_count is null or p_interval_count <= 0 then
    raise exception 'Recurring booking interval must be greater than zero.';
  end if;

  if p_occurrences is null or jsonb_typeof(p_occurrences) <> 'array' then
    raise exception 'Recurring booking occurrences must be an array.';
  end if;

  v_occurrence_total := jsonb_array_length(p_occurrences);

  if v_occurrence_total <= 0 then
    raise exception 'Recurring booking requires at least one occurrence.';
  end if;

  if v_occurrence_total > 50 then
    raise exception 'Recurring booking is capped at 50 occurrences.';
  end if;

  if p_occurrence_count is not null and p_occurrence_count <= 0 then
    raise exception 'Recurring booking occurrence count must be greater than zero.';
  end if;

  if p_ends_on is null and coalesce(p_occurrence_count, v_occurrence_total) is null then
    raise exception 'Recurring booking requires an end date or occurrence count.';
  end if;

  if p_approval_required then
    v_status := 'pending';
  else
    v_status := 'confirmed';
  end if;

  insert into public.booking_recurrence_series (
    owner_user_id,
    facility_id,
    title,
    description,
    frequency,
    interval_count,
    starts_on,
    ends_on,
    occurrence_count,
    created_by,
    status
  )
  values (
    p_owner_user_id,
    p_facility_id,
    p_title,
    nullif(trim(p_description), ''),
    p_frequency,
    p_interval_count,
    p_starts_on,
    p_ends_on,
    coalesce(p_occurrence_count, v_occurrence_total),
    auth.uid(),
    'active'
  )
  returning id
  into v_series_id;

  for v_occurrence in
    select value
    from jsonb_array_elements(p_occurrences)
  loop
    v_sequence := nullif(v_occurrence->>'sequence', '')::integer;
    v_starts_at := nullif(v_occurrence->>'startsAt', '')::timestamptz;
    v_ends_at := nullif(v_occurrence->>'endsAt', '')::timestamptz;

    if v_sequence is null or v_sequence <= 0 then
      raise exception 'Recurring booking occurrence sequence is invalid.';
    end if;

    perform public.validate_booking_mutation_input(
      p_facility_id,
      p_owner_user_id,
      p_attendee_count,
      v_starts_at,
      v_ends_at
    );

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
      approval_required,
      recurrence_series_id,
      recurrence_sequence
    )
    values (
      p_facility_id,
      p_owner_user_id,
      auth.uid(),
      p_title,
      nullif(trim(p_description), ''),
      p_attendee_count,
      v_status,
      v_starts_at,
      v_ends_at,
      p_approval_required,
      v_series_id,
      v_sequence
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
        p_owner_user_id
      );
    end if;

    series_id := v_series_id;
    booking_id := v_booking.id;
    recurrence_sequence := v_booking.recurrence_sequence;
    status := v_booking.status;
    starts_at := v_booking.starts_at;
    ends_at := v_booking.ends_at;
    return next;
  end loop;
end;
$$;

revoke all on function public.create_recurring_booking_series(
  uuid,
  uuid,
  text,
  text,
  integer,
  boolean,
  text,
  integer,
  date,
  date,
  integer,
  jsonb
) from public, anon, authenticated, service_role;

grant execute on function public.create_recurring_booking_series(
  uuid,
  uuid,
  text,
  text,
  integer,
  boolean,
  text,
  integer,
  date,
  date,
  integer,
  jsonb
) to authenticated;

comment on function public.update_own_booking(
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) is
  'Safely updates editable fields for an authenticated owner booking while preserving direct table update restrictions.';

comment on function public.admin_create_booking(
  uuid,
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz,
  boolean,
  boolean,
  text,
  integer,
  text,
  text,
  text
) is
  'Service-role RPC for admin-created bookings. Validates the supplied actor is an active admin or super_admin.';

comment on function public.create_recurring_booking_series(
  uuid,
  uuid,
  text,
  text,
  integer,
  boolean,
  text,
  integer,
  date,
  date,
  integer,
  jsonb
) is
  'Creates a recurrence series and all provided occurrences atomically, with recurrence linkage inserted on each booking.';
