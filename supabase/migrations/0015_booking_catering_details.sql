-- Booking catering / food and drinks details.
-- Additive nullable fields keep historical bookings intact and let existing
-- booking RLS continue protecting the new booking metadata.

alter table public.bookings
  add column if not exists catering_required boolean not null default false,
  add column if not exists catering_type text,
  add column if not exists catering_pax integer,
  add column if not exists catering_serving_time text,
  add column if not exists catering_dietary_notes text,
  add column if not exists catering_notes text;

alter table public.bookings
  add constraint bookings_catering_type_check
  check (
    catering_type is null
    or catering_type in (
      'water',
      'coffee_tea',
      'light_refreshments',
      'snacks',
      'packed_meals',
      'buffet_catering',
      'vip_catering',
      'other'
    )
  );

alter table public.bookings
  add constraint bookings_catering_serving_time_check
  check (
    catering_serving_time is null
    or catering_serving_time in (
      'before_meeting',
      'during_meeting',
      'lunch_break',
      'after_meeting',
      'custom'
    )
  );

alter table public.bookings
  add constraint bookings_catering_required_details_check
  check (
    catering_required = false
    or (
      catering_type is not null
      and catering_pax is not null
      and catering_pax > 0
      and catering_serving_time is not null
    )
  );

create or replace function public.create_booking(
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
  p_catering_notes text default null
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
    p_user_id,
    coalesce(p_created_by, auth.uid()),
    p_title,
    p_description,
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
  boolean,
  boolean,
  text,
  integer,
  text,
  text,
  text
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
  boolean,
  boolean,
  text,
  integer,
  text,
  text,
  text
) to authenticated;
