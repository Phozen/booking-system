-- Attendees are recorded without RSVP. New invite rows default to accepted.

alter table public.booking_invitations
  alter column status set default 'accepted';

update public.booking_invitations
set
  status = 'accepted',
  responded_at = coalesce(responded_at, now()),
  updated_at = now()
where status = 'pending';

drop function if exists public.create_booking_with_participants(
  uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean,
  boolean, text, integer, text, text, text, uuid[], uuid[], boolean
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
  if exists (select 1 from unnest(v_departments) as selected_department(department_id) left join public.departments d on d.id = selected_department.department_id and d.is_active where d.id is null) then raise exception 'Choose active departments only.'; end if;
  if exists (select 1 from unnest(v_invitees) as selected_invitee(user_id) left join public.profiles p on p.id = selected_invitee.user_id and p.status = 'active' where p.id is null) then raise exception 'Choose active internal users only.'; end if;
  select * into v_booking from public.create_booking(p_facility_id, p_user_id, p_created_by, p_title, p_description, p_attendee_count, p_starts_at, p_ends_at, p_approval_required, p_catering_required, p_catering_type, p_catering_pax, p_catering_serving_time, p_catering_dietary_notes, p_catering_notes);
  perform set_config('booking_system.allow_booking_mutation', 'on', true);
  update public.bookings set teams_meeting = coalesce(p_teams_meeting, false) where id = v_booking.id returning * into v_booking;
  perform set_config('booking_system.allow_booking_mutation', 'off', true);
  insert into public.booking_departments (booking_id, department_id) select v_booking.id, selected_department.department_id from unnest(v_departments) as selected_department(department_id);
  insert into public.booking_invitations (booking_id, invited_user_id, invited_by, status)
  select v_booking.id, selected_invitee.user_id, auth.uid(), 'accepted'
  from unnest(v_invitees) as selected_invitee(user_id);
  return v_booking;
exception when others then
  perform set_config('booking_system.allow_booking_mutation', 'off', true); raise;
end;
$$;

revoke all on function public.create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, boolean, text, integer, text, text, text, uuid[], uuid[], boolean) from public, anon, authenticated, service_role;
grant execute on function public.create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, boolean, text, integer, text, text, text, uuid[], uuid[], boolean) to authenticated;

create or replace function public.admin_create_booking_with_participants(
  p_actor_user_id uuid, p_target_user_id uuid, p_facility_id uuid, p_title text,
  p_description text, p_attendee_count integer, p_starts_at timestamptz,
  p_ends_at timestamptz, p_approval_required boolean,
  p_department_ids uuid[] default array[]::uuid[], p_invited_user_ids uuid[] default array[]::uuid[]
)
returns public.bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_booking public.bookings;
  v_departments uuid[] := coalesce(p_department_ids, array[]::uuid[]);
  v_invitees uuid[] := coalesce(p_invited_user_ids, array[]::uuid[]);
begin
  if not exists (select 1 from public.profiles where id = p_actor_user_id and role::text in ('admin','super_admin') and status = 'active') then raise exception 'Only active admins can create bookings for another user.'; end if;
  if cardinality(v_departments) <> cardinality(array(select distinct unnest(v_departments))) or cardinality(v_invitees) <> cardinality(array(select distinct unnest(v_invitees))) then raise exception 'Duplicate participants are not allowed.'; end if;
  if exists (select 1 from unnest(v_departments) as id left join public.departments d on d.id=id and d.is_active where d.id is null) then raise exception 'Choose active departments only.'; end if;
  if exists (select 1 from unnest(v_invitees) as id left join public.profiles p on p.id=id and p.status='active' where p.id is null) then raise exception 'Choose active internal users only.'; end if;
  select * into v_booking from public.admin_create_booking(p_actor_user_id, p_target_user_id, p_facility_id, p_title, p_description, p_attendee_count, p_starts_at, p_ends_at, p_approval_required);
  insert into public.booking_departments (booking_id, department_id) select v_booking.id, id from unnest(v_departments) as id;
  insert into public.booking_invitations (booking_id, invited_user_id, invited_by, status)
  select v_booking.id, id, p_actor_user_id, 'accepted'
  from unnest(v_invitees) as id;
  return v_booking;
end;
$$;

revoke all on function public.admin_create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, uuid[], uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.admin_create_booking_with_participants(uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, uuid[], uuid[]) to service_role;
