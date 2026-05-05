-- Transaction-rolled-back back-to-back booking verification.
--
-- Replace PASTE_PROFILE_ID_HERE with an active public.profiles.id.
-- Expected notice: back-to-back bookings were accepted.
-- The final rollback prevents permanent test bookings from being stored.

begin;

do $$
declare
  v_user_id uuid := 'PASTE_PROFILE_ID_HERE';
  v_facility_id uuid;
  v_start timestamptz := date_trunc('day', now()) + interval '15 days 10 hours';
begin
  select id
  into v_facility_id
  from public.facilities
  where code = 'MR-L5-02';

  if v_facility_id is null then
    raise exception 'Facility MR-L5-02 was not found.';
  end if;

  insert into public.bookings (
    facility_id,
    user_id,
    created_by,
    title,
    status,
    starts_at,
    ends_at,
    approval_required
  )
  values (
    v_facility_id,
    v_user_id,
    v_user_id,
    'QA Back-to-back Test 1',
    'confirmed',
    v_start,
    v_start + interval '1 hour',
    false
  );

  insert into public.bookings (
    facility_id,
    user_id,
    created_by,
    title,
    status,
    starts_at,
    ends_at,
    approval_required
  )
  values (
    v_facility_id,
    v_user_id,
    v_user_id,
    'QA Back-to-back Test 2',
    'confirmed',
    v_start + interval '1 hour',
    v_start + interval '2 hours',
    false
  );

  raise notice 'PASS: back-to-back bookings were accepted.';
end $$;

rollback;
