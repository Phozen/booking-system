-- Transaction-rolled-back overlap prevention verification.
--
-- Replace PASTE_PROFILE_ID_HERE with an active public.profiles.id.
-- Expected notice: overlapping booking was rejected.
-- The final rollback prevents permanent test bookings from being stored.

begin;

do $$
declare
  v_user_id uuid := 'PASTE_PROFILE_ID_HERE';
  v_facility_id uuid;
  v_start timestamptz := date_trunc('day', now()) + interval '14 days 10 hours';
begin
  select id
  into v_facility_id
  from public.facilities
  where code = 'MR-L5-01';

  if v_facility_id is null then
    raise exception 'Facility MR-L5-01 was not found.';
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
    'QA Overlap Test 1',
    'confirmed',
    v_start,
    v_start + interval '1 hour',
    false
  );

  begin
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
      'QA Overlap Test 2 - Should Fail',
      'confirmed',
      v_start + interval '30 minutes',
      v_start + interval '90 minutes',
      false
    );

    raise exception 'Overlap prevention failed: second booking was inserted.';
  exception
    when exclusion_violation then
      raise notice 'PASS: overlapping booking was rejected by exclusion constraint.';
  end;
end $$;

rollback;
