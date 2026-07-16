-- Run against a disposable, fully migrated local database:
--   npx supabase test db
-- The transaction is always rolled back and never targets production.

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into public.microsoft_access_config (singleton, tenant_id)
values (true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
on conflict (singleton) do update
set tenant_id = excluded.tenant_id;

insert into public.approved_users (email, role, status)
values
  ('approval-employee@example.test', 'employee', 'active'),
  ('approval-admin@example.test', 'admin', 'active')
on conflict (normalized_email) do update
set role = excluded.role, status = excluded.status;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'approval-employee@example.test',
    '',
    now(),
    '{"provider":"azure","providers":["azure"]}'::jsonb,
    '{"full_name":"Approval Employee"}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'approval-admin@example.test',
    '',
    now(),
    '{"provider":"azure","providers":["azure"]}'::jsonb,
    '{"full_name":"Approval Admin"}'::jsonb,
    now(),
    now()
  );

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    'approval-employee@example.test',
    '{"sub":"approval-employee","email":"approval-employee@example.test","tid":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}'::jsonb,
    'azure',
    now(),
    now(),
    now()
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'approval-admin@example.test',
    '{"sub":"approval-admin","email":"approval-admin@example.test","tid":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}'::jsonb,
    'azure',
    now(),
    now(),
    now()
  );

insert into public.facilities (
  id,
  code,
  name,
  slug,
  level,
  type,
  capacity,
  status,
  requires_approval,
  is_archived
)
values (
  '55555555-5555-4555-8555-555555555555',
  'T-APPROVAL-SECURITY',
  'Approval Security Test Room',
  'approval-security-test-room',
  'T',
  'meeting_room',
  20,
  'active',
  null,
  false
);

update public.system_settings
set value = 'true'::jsonb
where key = 'default_approval_required';

update public.system_settings
set value = 'false'::jsonb
where key = 'facility_approval_override_enabled';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"approval-employee@example.test"}',
  true
);

select throws_ok(
  $$
    select public.create_booking(
      '55555555-5555-4555-8555-555555555555',
      '11111111-1111-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
      'Malicious false approval',
      null,
      2,
      '2099-01-01 10:00:00+00',
      '2099-01-01 11:00:00+00',
      false,
      false,
      null,
      null,
      null,
      null,
      null
    )
  $$,
  'P0001',
  'Booking approval requirement does not match the effective database policy.',
  'malicious false approval input is rejected'
);

select lives_ok(
  $$
    select public.create_booking(
      '55555555-5555-4555-8555-555555555555',
      '11111111-1111-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
      'Pending review target',
      null,
      2,
      '2099-01-02 10:00:00+00',
      '2099-01-02 11:00:00+00',
      true,
      false,
      null,
      null,
      null,
      null,
      null
    )
  $$,
  'policy-compliant pending booking is created'
);

select throws_ok(
  $$
    insert into public.bookings (
      facility_id, user_id, created_by, title, status,
      starts_at, ends_at, approval_required
    ) values (
      '55555555-5555-4555-8555-555555555555',
      '11111111-1111-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
      'Direct insert',
      'pending',
      '2099-01-03 10:00:00+00',
      '2099-01-03 11:00:00+00',
      true
    )
  $$,
  '42501',
  'permission denied for table bookings',
  'authenticated direct booking insert is denied'
);

select throws_ok(
  $$update public.bookings set title = 'Direct update' where title = 'Pending review target'$$,
  '42501',
  'permission denied for table bookings',
  'authenticated direct booking update is denied'
);

select throws_ok(
  $$
    update public.booking_approvals
    set status = 'approved'
    where booking_id = (
      select id from public.bookings where title = 'Pending review target'
    )
  $$,
  '42501',
  'permission denied for table booking_approvals',
  'authenticated direct approval update is denied'
);

select throws_ok(
  $$
    select public.review_booking_approval(
      (select id from public.bookings where title = 'Pending review target'),
      'approved',
      null
    )
  $$,
  'P0001',
  'Only active admins can review booking approvals.',
  'employee cannot call guarded review RPC'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"approval-admin@example.test"}',
  true
);

select lives_ok(
  $$
    select public.review_booking_approval(
      (select id from public.bookings where title = 'Pending review target'),
      'approved',
      'Approved in database test'
    )
  $$,
  'admin review RPC updates booking and approval atomically'
);

select results_eq(
  $$select status::text from public.bookings where title = 'Pending review target'$$,
  array['confirmed'::text],
  'approved booking is confirmed'
);

select results_eq(
  $$
    select ba.status::text
    from public.booking_approvals ba
    join public.bookings b on b.id = ba.booking_id
    where b.title = 'Pending review target'
  $$,
  array['approved'::text],
  'approval row is approved in the same transaction'
);

select throws_ok(
  $$
    select public.review_booking_approval(
      (select id from public.bookings where title = 'Pending review target'),
      'rejected',
      null
    )
  $$,
  'P0001',
  'Only pending approval-required bookings can be reviewed.',
  'nonpending review transition is rejected'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"approval-employee@example.test"}',
  true
);

select lives_ok(
  $$
    select public.create_booking(
      '55555555-5555-4555-8555-555555555555',
      '11111111-1111-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
      'Owner cancellation target',
      null,
      2,
      '2099-01-04 10:00:00+00',
      '2099-01-04 11:00:00+00',
      true,
      false,
      null,
      null,
      null,
      null,
      null
    )
  $$,
  'second pending booking is created for cancellation'
);

select lives_ok(
  $$
    select public.cancel_own_booking(
      (select id from public.bookings where title = 'Owner cancellation target'),
      'No longer needed'
    )
  $$,
  'owner cancellation succeeds atomically'
);

select results_eq(
  $$select status::text from public.bookings where title = 'Owner cancellation target'$$,
  array['cancelled'::text],
  'owner cancellation changes booking status'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.booking_approvals ba
    join public.bookings b on b.id = ba.booking_id
    where b.title = 'Owner cancellation target'
      and ba.status = 'pending'
  $$,
  array[0::bigint],
  'cancelled booking has no pending approval rows'
);

select * from finish();

rollback;
