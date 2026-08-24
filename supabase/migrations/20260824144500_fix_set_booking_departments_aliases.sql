-- Qualify unnest columns in set_booking_departments so PostgreSQL does not
-- confuse them with departments.id (fixes "column reference id is ambiguous").
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
    select 1
    from unnest(v_department_ids) as selected_department(department_id)
    left join public.departments d
      on d.id = selected_department.department_id
      and d.is_active
    where d.id is null
  ) then
    raise exception 'Choose active departments only.';
  end if;

  delete from public.booking_departments where booking_id = p_booking_id;
  insert into public.booking_departments (booking_id, department_id)
  select p_booking_id, selected_department.department_id
  from unnest(v_department_ids) as selected_department(department_id);
end;
$$;

revoke all on function public.set_booking_departments(uuid, uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.set_booking_departments(uuid, uuid[]) to authenticated;
