-- Optional hybrid-room meeting state. The Teams join URL remains solely in Outlook.
alter table public.bookings
  add column if not exists teams_meeting boolean not null default false;

comment on column public.bookings.teams_meeting is
  'Whether this booking must create a Teams-enabled Outlook event after confirmation. Do not store the Teams join URL.';

drop function if exists public.create_booking_with_participants(
  uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean,
  boolean, text, integer, text, text, text, uuid[], uuid[]
);

create function public.create_booking_with_participants(
  p_facility_id uuid, p_user_id uuid, p_created_by uuid, p_title text,
  p_description text, p_attendee_count integer, p_starts_at timestamptz,
  p_ends_at timestamptz, p_approval_required boolean,
  p_catering_required boolean default false, p_catering_type text default null,
  p_catering_pax integer default null, p_catering_serving_time text default null,
  p_catering_dietary_notes text default null, p_catering_notes text default null,
  p_department_ids uuid[] default array[]::uuid[],
  p_invited_user_ids uuid[] default array[]::uuid[],
  p_teams_meeting boolean default false
) returns public.bookings language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings;
  v_departments uuid[] := coalesce(p_department_ids, array[]::uuid[]);
  v_invitees uuid[] := coalesce(p_invited_user_ids, array[]::uuid[]);
begin
  if cardinality(v_departments) <> cardinality(array(select distinct unnest(v_departments))) then raise exception 'A department may only be tagged once.'; end if;
  if cardinality(v_invitees) <> cardinality(array(select distinct unnest(v_invitees))) then raise exception 'A user may only be invited once.'; end if;
  if p_user_id = any(v_invitees) then raise exception 'The booking owner cannot be invited.'; end if;
  if exists (select 1 from unnest(v_departments) as selected_department(department_id) left join public.departments d on d.id = selected_department.department_id and d.is_active where d.id is null) then raise exception 'Choose active departments only.'; end if;
  if exists (select 1 from unnest(v_invitees) as selected_invitee(user_id) left join public.profiles p on p.id = selected_invitee.user_id and p.status = 'active' where p.id is null) then raise exception 'Choose active internal users only.'; end if;
  select * into v_booking from public.create_booking(p_facility_id, p_user_id, p_created_by, p_title, p_description, p_attendee_count, p_starts_at, p_ends_at, p_approval_required, p_catering_required, p_catering_type, p_catering_pax, p_catering_serving_time, p_catering_dietary_notes, p_catering_notes);
  perform set_config('booking_system.allow_booking_mutation', 'on', true);
  update public.bookings set teams_meeting = coalesce(p_teams_meeting, false) where id = v_booking.id returning * into v_booking;
  perform set_config('booking_system.allow_booking_mutation', 'off', true);
  insert into public.booking_departments (booking_id, department_id) select v_booking.id, selected_department.department_id from unnest(v_departments) as selected_department(department_id);
  insert into public.booking_invitations (booking_id, invited_user_id, invited_by) select v_booking.id, selected_invitee.user_id, auth.uid() from unnest(v_invitees) as selected_invitee(user_id);
  return v_booking;
exception when others then
  perform set_config('booking_system.allow_booking_mutation', 'off', true); raise;
end;
$$;

revoke all on function public.create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, boolean, text, integer, text, text, text, uuid[], uuid[], boolean) from public, anon, authenticated, service_role;
grant execute on function public.create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, boolean, text, integer, text, text, text, uuid[], uuid[], boolean) to authenticated;

drop function if exists public.update_own_booking(uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, text, integer, text, text, text);

create function public.update_own_booking(
  p_booking_id uuid, p_facility_id uuid, p_title text, p_description text,
  p_attendee_count integer, p_starts_at timestamptz, p_ends_at timestamptz,
  p_catering_required boolean default false, p_catering_type text default null,
  p_catering_pax integer default null, p_catering_serving_time text default null,
  p_catering_dietary_notes text default null, p_catering_notes text default null,
  p_teams_meeting boolean default false
) returns public.bookings language plpgsql security definer set search_path = public as $$
declare v_booking public.bookings; v_updated public.bookings;
begin
  if not public.is_active_user() then raise exception 'Only active users can update bookings.'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.'; end if;
  if v_booking.user_id <> auth.uid() then raise exception 'Users can only update their own bookings.'; end if;
  if v_booking.status not in ('pending', 'confirmed') then raise exception 'This booking can no longer be edited.'; end if;
  if v_booking.status = 'confirmed' and coalesce(p_teams_meeting, false) is distinct from v_booking.teams_meeting then raise exception 'Teams meeting choice cannot be changed after confirmation.'; end if;
  perform public.validate_booking_mutation_input(p_facility_id, auth.uid(), p_attendee_count, p_starts_at, p_ends_at);
  perform set_config('booking_system.allow_booking_mutation', 'on', true);
  update public.bookings set facility_id = p_facility_id, title = p_title, description = nullif(trim(p_description), ''), attendee_count = p_attendee_count, starts_at = p_starts_at, ends_at = p_ends_at, catering_required = p_catering_required, catering_type = p_catering_type, catering_pax = p_catering_pax, catering_serving_time = p_catering_serving_time, catering_dietary_notes = p_catering_dietary_notes, catering_notes = p_catering_notes, teams_meeting = coalesce(p_teams_meeting, false) where id = p_booking_id and user_id = auth.uid() and status in ('pending', 'confirmed') returning * into v_updated;
  perform set_config('booking_system.allow_booking_mutation', 'off', true);
  if v_updated.id is null then raise exception 'Booking could not be updated.'; end if;
  return v_updated;
exception when others then perform set_config('booking_system.allow_booking_mutation', 'off', true); raise;
end;
$$;

revoke all on function public.update_own_booking(uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, text, integer, text, text, text, boolean) from public, anon, authenticated, service_role;
grant execute on function public.update_own_booking(uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, text, integer, text, text, text, boolean) to authenticated;

-- Keep the direct-table cancellation path unable to alter the hybrid flag.
create or replace function public.prevent_unsafe_user_booking_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('booking_system.allow_booking_mutation', true) = 'on' then return new; end if;
  if auth.uid() = old.user_id then
    if old.status not in ('pending', 'confirmed') or new.status <> 'cancelled' then raise exception 'Users can only cancel their own active bookings.'; end if;
    if new.cancelled_by is distinct from auth.uid() or new.cancelled_at is null or length(coalesce(new.cancellation_reason, '')) > 2000 then raise exception 'Booking cancellation metadata is invalid.'; end if;
    if new.facility_id is distinct from old.facility_id or new.user_id is distinct from old.user_id or new.created_by is distinct from old.created_by or new.title is distinct from old.title or new.description is distinct from old.description or new.attendee_count is distinct from old.attendee_count or new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at or new.approval_required is distinct from old.approval_required or new.completed_at is distinct from old.completed_at or new.metadata is distinct from old.metadata or new.catering_required is distinct from old.catering_required or new.catering_type is distinct from old.catering_type or new.catering_pax is distinct from old.catering_pax or new.catering_serving_time is distinct from old.catering_serving_time or new.catering_dietary_notes is distinct from old.catering_dietary_notes or new.catering_notes is distinct from old.catering_notes or new.teams_meeting is distinct from old.teams_meeting or new.usage_status is distinct from old.usage_status or new.checked_in_at is distinct from old.checked_in_at or new.checked_in_by is distinct from old.checked_in_by or new.no_show_marked_at is distinct from old.no_show_marked_at or new.no_show_marked_by is distinct from old.no_show_marked_by or new.recurrence_series_id is distinct from old.recurrence_series_id or new.recurrence_sequence is distinct from old.recurrence_sequence then raise exception 'Users cannot edit booking details during cancellation.'; end if;
    return new;
  end if;
  raise exception 'Booking updates must use an authorized mutation RPC.';
end;
$$;
