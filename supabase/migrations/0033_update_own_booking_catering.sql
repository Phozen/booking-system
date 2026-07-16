create or replace function public.update_own_booking(
  p_booking_id uuid,
  p_facility_id uuid,
  p_title text,
  p_description text,
  p_attendee_count integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
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
    ends_at = p_ends_at,
    catering_required = p_catering_required,
    catering_type = p_catering_type,
    catering_pax = p_catering_pax,
    catering_serving_time = p_catering_serving_time,
    catering_dietary_notes = p_catering_dietary_notes,
    catering_notes = p_catering_notes
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
