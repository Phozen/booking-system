# Database Schema and Access Model

## Scope

This is the implementation-oriented overview of QBook’s Supabase/PostgreSQL data model. The executable source of truth is the append-only SQL in `supabase/migrations/`; this document intentionally describes stable responsibilities rather than duplicating every column declaration.

## Core domains

| Domain | Main records | Responsibility |
| --- | --- | --- |
| Identity and access | `profiles`, `approved_users`, Microsoft access configuration | Application profile, active status, pre-provisioned role/allowlist control |
| Facilities | `facilities`, `facility_photos`, `equipment`, `facility_equipment` | Bookable spaces and managed assets |
| Bookings | `bookings`, `booking_approvals`, `booking_invitations` | Lifecycle, approvals, internal attendees, catering, usage state |
| Departments | `departments`, `booking_departments` | Active department catalogue and per-booking involvement |
| Availability | `blocked_periods`, `blocked_period_facilities`, `maintenance_closures` | Dates/times that cannot be booked |
| Operations | `email_notifications`, calendar sync records, audit/export records | Delivery, integration state, traceability, reporting |
| Configuration | `system_settings` | Non-secret runtime settings managed by authorised operators |

## Booking integrity

Bookings store UTC `starts_at` and `ends_at` timestamps. PostgreSQL uses a generated half-open range:

```text
[starts_at, ends_at)
```

An exclusion constraint prevents overlapping `pending`/`confirmed` bookings for the same facility. It deliberately permits a new booking to start exactly when another one ends.

Booking mutation is not a client-only operation. The database functions validate the active actor, ownership/admin authority, booking state, facility/availability rules, and data integrity. Important functions include:

- `create_booking_with_participants`
- `admin_create_booking_with_participants`
- `set_booking_departments`

The participant creation functions create a booking, selected department tags, and initial internal invitations in one transaction. They reject duplicate department/user IDs, owner-as-invitee input, inactive departments, and inactive invitees.

## Departments and invitations

`departments` contains a unique name and email plus an active flag. `booking_departments` is the normalised join table. Archived/inactive departments can remain associated with historic bookings while only active departments are selectable for new/edited bookings.

`booking_invitations` records internal invitees and RSVP state. The booking owner cannot be invited to their own booking.

## Roles and Row Level Security

The model uses the following application roles:

| Role | Data scope |
| --- | --- |
| Employee | Own records, booking invitations, permitted calendar data, and active reference data |
| Admin | Operational booking/facility/availability/report activity |
| Super Admin | Admin scope plus allowlist users, roles, settings, and departments |

RLS is enabled on application tables. Policies and security-definer functions enforce data visibility and mutation authority. The service-role key bypasses RLS and is restricted to the server-only admin client.

## Lifecycle and audit behaviour

- Active bookings can transition through pending/confirmed/rejected/cancelled/completed and usage-related states according to guarded mutation rules.
- Approval records preserve review information.
- Important actions produce audit records where supported.
- Email and calendar integration state is stored separately from the booking so provider failure does not invalidate an otherwise valid booking.
- Facility records are archived rather than destructively removed where history must remain reportable.

## Recurrence retirement

Historical recurrence tables/links remain for audit. The current migrations remove operational recurrence functions, settings, triggers, and entry points. New features must not assume recurring booking creation is available.

## Storage

Facility images use the private `facility-photos` bucket. Application behaviour expects active users to read permitted photos and active administrators to manage them. The UI uses signed URLs for private display.

## Migration management

The migration directory includes numbered baseline migrations and later timestamped migrations. Apply every migration in order to each intended environment:

```powershell
npm.cmd exec supabase -- migration list
npm.cmd exec supabase db push
```

Never edit an already-applied migration. Add a new, reviewed migration for any corrective change.

<!-- VERIFY: Compare the linked/production migration list with supabase/migrations before declaring a target environment current. -->
