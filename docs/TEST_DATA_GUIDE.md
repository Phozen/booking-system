# Test Data Guide

This guide prepares repeatable QA data for the internal Booking System. Use a non-production Supabase project when possible. If using the current linked project, choose clearly named test accounts and test booking titles.

## Prerequisites

1. Apply migrations:

```powershell
npx.cmd supabase db push
```

2. Confirm migrations:

```powershell
npx.cmd supabase migration list
```

3. Start the app:

```powershell
npm.cmd run dev
```

4. Open `http://localhost:3000`.

## Create The First Admin

1. Register a user through `/register`.
2. Open the Supabase SQL Editor.
3. Confirm the profile exists:

```sql
select id, email, role, status
from public.profiles
order by created_at desc;
```

4. Promote the registered user:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

5. Log in again and open `/admin/dashboard`.

## Create An Employee Test User

1. Register another user through `/register`, or invite/create one through Supabase Auth.
2. Confirm the profile is active employee:

```sql
update public.profiles
set role = 'employee', status = 'active'
where email = 'YOUR_EMPLOYEE_EMAIL@example.com';
```

3. Log in as the employee and open `/dashboard`.

## Verify Default Facilities

Run:

```sql
select code, name, slug, level, type, capacity, status, is_archived
from public.facilities
where code in ('MR-L5-01', 'MR-L5-02', 'MR-L6-01', 'MR-L6-02', 'EH-L1-01')
order by display_order;
```

Expected facilities:

| Code | Name | Level | Type |
| --- | --- | --- | --- |
| MR-L5-01 | Meeting Room 1 | Level 5 | meeting_room |
| MR-L5-02 | Meeting Room 2 | Level 5 | meeting_room |
| MR-L6-01 | Meeting Room 1 | Level 6 | meeting_room |
| MR-L6-02 | Meeting Room 2 | Level 6 | meeting_room |
| EH-L1-01 | Event Hall | Level 1 | event_hall |

## Suggested Test Bookings

Use a future date so tests do not collide with real usage.

| Test | Facility | Time | Expected |
| --- | --- | --- | --- |
| Valid confirmed booking | MR-L5-01 | 10:00 to 11:00 | Created as confirmed when approval is disabled |
| Overlap conflict | MR-L5-01 | 10:30 to 11:30 | Rejected |
| Back-to-back | MR-L5-01 | 11:00 to 12:00 | Allowed |
| Capacity check | MR-L5-01 | Any free slot with attendee count above capacity | Rejected |
| Pending approval | EH-L1-01 or any approval-required facility | Any free slot | Created as pending |

## Suggested Blocked Period Tests

1. As admin, create an all-facilities blocked period for a future 2-hour window.
2. As employee, try booking any facility during that window.
3. Expected: booking is blocked with a blocked-period message.
4. Deactivate the blocked period.
5. Expected: the same booking time is allowed if no other conflict exists.

Selected-facility variant:

1. Create a blocked period scoped to `MR-L5-01`.
2. Try booking `MR-L5-01` during the period.
3. Expected: blocked.
4. Try booking `MR-L5-02` during the same period.
5. Expected: allowed if no other conflict exists.

## Suggested Maintenance Closure Tests

1. As admin, create a maintenance closure for `MR-L6-01` with status `scheduled`.
2. Try booking `MR-L6-01` during the closure.
3. Expected: blocked with maintenance message.
4. Change status to `in_progress`.
5. Expected: still blocked.
6. Complete or cancel the closure.
7. Expected: no longer blocks future bookings.

## Suggested Approval Mode Tests

Global approval mode:

```sql
update public.system_settings
set value = 'true'::jsonb
where key = 'default_approval_required';
```

Then create a booking for a facility whose `requires_approval` is `null`. Expected status: `pending`.

Disable global approval:

```sql
update public.system_settings
set value = 'false'::jsonb
where key = 'default_approval_required';
```

Facility override:

```sql
update public.system_settings
set value = 'true'::jsonb
where key = 'facility_approval_override_enabled';

update public.facilities
set requires_approval = true
where code = 'EH-L1-01';
```

Expected: bookings for `EH-L1-01` become `pending`.

## Suggested Report And Export Tests

1. Create at least one confirmed, pending, cancelled, approved, and rejected booking.
2. Open `/admin/reports`.
3. Apply date range, facility, and status filters.
4. Export each CSV report.
5. Verify `public.export_logs`:

```sql
select report_type, file_name, row_count, created_at
from public.export_logs
order by created_at desc
limit 10;
```

6. Verify export audit logs:

```sql
select action, entity_type, actor_email, summary, created_at
from public.audit_logs
where action = 'export'
order by created_at desc
limit 10;
```

## Test Helper SQL Scripts

Safe read-only or transaction-rolled-back scripts are stored in:

```txt
supabase/test-sql/
```

Recommended order:

1. `verify_admin_user.sql`
2. `verify_facilities.sql`
3. `verify_overlap_prevention.sql`
4. `verify_back_to_back_bookings.sql`

For booking scripts, replace `PASTE_PROFILE_ID_HERE` with an active profile ID before running. The scripts wrap test inserts in `begin` and `rollback` so they should not leave permanent booking rows.

## Cleanup Guidance

Prefer deactivating or cancelling records through the app so audit logs are created. If manual cleanup is needed, do it only in a non-production project and record what was removed. No destructive cleanup SQL is included in this phase.
