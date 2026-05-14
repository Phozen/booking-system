Paste this into:

```txt
docs/DATABASE_SCHEMA.md
```

````md
# Database Schema

## 1. Purpose

This document defines the proposed PostgreSQL/Supabase database schema for the internal Booking System.

The database must support:

- Email/password users through Supabase Auth
- Employee and admin roles
- Facility management
- Facility photos and equipment
- Booking creation
- Strict booking conflict prevention
- Configurable approval behavior
- Blocked periods
- Maintenance closures
- Email notification tracking
- Reports and exports
- Audit logs
- System settings

The database must enforce data integrity and should not rely only on frontend validation.

---

## 2. Database Principles

1. Use Supabase Auth for authentication.
2. Use a `profiles` table for application-level user data.
3. Use PostgreSQL constraints wherever possible.
4. Use Row Level Security for authorization.
5. Store all timestamps in UTC.
6. Display dates and times in the configured app timezone.
7. Use database-level protection against overlapping active bookings.
8. Keep booking history instead of deleting booking records.
9. Use soft statuses such as `cancelled`, `rejected`, and `archived` rather than destructive deletion.
10. Use audit logs for important actions.
11. Store sensitive secrets in environment variables, not database settings.

---

## 3. Required PostgreSQL Extensions

Enable the following extensions in Supabase:

```sql
create extension if not exists "uuid-ossp";
create extension if not exists "btree_gist";
````

`btree_gist` is required for exclusion constraints used to prevent overlapping bookings.

---

## 4. Enum Types

Create enum types for consistent status and role values.

```sql
create type user_role as enum (
  'employee',
  'admin',
  'super_admin'
);

create type user_status as enum (
  'active',
  'disabled',
  'pending'
);

create type facility_type as enum (
  'meeting_room',
  'event_hall'
);

create type facility_status as enum (
  'active',
  'inactive',
  'under_maintenance',
  'archived'
);

create type booking_status as enum (
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
  'expired'
);

create type approval_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type blocked_period_scope as enum (
  'all_facilities',
  'selected_facilities'
);

create type maintenance_status as enum (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

create type email_notification_status as enum (
  'queued',
  'sending',
  'sent',
  'failed',
  'cancelled'
);

create type email_notification_type as enum (
  'booking_confirmation',
  'booking_approval',
  'booking_rejection',
  'booking_cancellation',
  'booking_reminder',
  'booking_invitation',
  'booking_invitation_accepted',
  'booking_invitation_declined'
);

create type booking_invitation_status as enum (
  'pending',
  'accepted',
  'declined',
  'removed'
);

create type audit_action_type as enum (
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'cancel',
  'login',
  'logout',
  'export',
  'role_change',
  'settings_change'
);

create type audit_entity_type as enum (
  'user',
  'facility',
  'booking',
  'booking_approval',
  'blocked_period',
  'maintenance_closure',
  'email_notification',
  'system_setting',
  'report',
  'auth'
);
```

---

## 5. Tables Overview

Core tables:

| Table                       | Purpose                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `profiles`                  | Application user profiles linked to Supabase Auth          |
| `facilities`                | Meeting rooms and event hall records                       |
| `facility_photos`           | Facility image records                                     |
| `equipment`                 | Equipment master list                                      |
| `facility_equipment`        | Many-to-many relationship between facilities and equipment |
| `bookings`                  | Main booking records                                       |
| `booking_approvals`         | Approval/rejection history                                 |
| `booking_invitations`       | Internal booking attendee invitations and RSVP status      |
| `blocked_periods`           | Admin-created unavailable periods                          |
| `blocked_period_facilities` | Facilities affected by blocked periods                     |
| `maintenance_closures`      | Facility maintenance closures                              |
| `email_notifications`       | Email queue/history                                        |
| `audit_logs`                | System action logs                                         |
| `system_settings`           | Admin-configurable system behavior                         |
| `export_logs`               | Optional export tracking                                   |

---

## 6. Profiles Table

Supabase Auth stores authentication data in `auth.users`.

The application should store user profile and role data in `public.profiles`.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role user_role not null default 'employee',
  status user_status not null default 'active',
  department text,
  phone text,
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Notes

* `id` must match `auth.users.id`.
* Role-based authorization should use this table.
* `admin` is for daily operational administration.
* `super_admin` is for IT/system owners and security-sensitive configuration.
* Disabled users should not be able to access protected pages.

### Indexes

```sql
create index profiles_role_idx on public.profiles(role);
create index profiles_status_idx on public.profiles(status);
create index profiles_email_idx on public.profiles(email);
```

---

## 7. Facilities Table

Stores all bookable rooms and halls.

```sql
create table public.facilities (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  slug text not null unique,
  level text not null,
  type facility_type not null,
  capacity integer not null check (capacity > 0),
  description text,
  status facility_status not null default 'active',
  requires_approval boolean,
  display_order integer not null default 0,
  is_archived boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Field Notes

| Field               | Notes                                                         |
| ------------------- | ------------------------------------------------------------- |
| `code`              | Human-readable stable facility code, e.g. `MR-L5-01`          |
| `slug`              | URL-friendly identifier                                       |
| `requires_approval` | Nullable to allow fallback to global setting                  |
| `status`            | Controls whether facility is bookable                         |
| `display_order`     | Legacy/internal ordering field; not admin-managed in the UI    |
| `is_archived`       | Allows hiding old facilities while preserving booking history |

### Indexes

```sql
create index facilities_status_idx on public.facilities(status);
create index facilities_type_idx on public.facilities(type);
create index facilities_level_idx on public.facilities(level);
create index facilities_display_order_idx on public.facilities(display_order);
```

---

## 8. Facility Photos Table

Stores photos for each facility.

```sql
create table public.facility_photos (
  id uuid primary key default uuid_generate_v4(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  storage_bucket text not null default 'facility-photos',
  storage_path text not null,
  public_url text,
  alt_text text,
  is_primary boolean not null default false,
  display_order integer not null default 0,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Indexes

```sql
create index facility_photos_facility_id_idx on public.facility_photos(facility_id);
create index facility_photos_primary_idx on public.facility_photos(facility_id, is_primary);
```

### Optional Constraint

Only one primary photo per facility:

```sql
create unique index facility_photos_one_primary_per_facility_idx
on public.facility_photos(facility_id)
where is_primary = true;
```

---

## 9. Equipment Table

Stores the master equipment list.

```sql
create table public.equipment (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  icon_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Example Equipment

* Projector
* TV screen
* Whiteboard
* Video conferencing system
* Microphone
* Speaker system
* HDMI cable
* Air conditioning
* Tables
* Chairs

### Indexes

```sql
create index equipment_is_active_idx on public.equipment(is_active);
```

---

## 10. Facility Equipment Table

Many-to-many relationship between facilities and equipment.

```sql
create table public.facility_equipment (
  facility_id uuid not null references public.facilities(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  created_at timestamptz not null default now(),
  primary key (facility_id, equipment_id)
);
```

### Indexes

```sql
create index facility_equipment_facility_id_idx on public.facility_equipment(facility_id);
create index facility_equipment_equipment_id_idx on public.facility_equipment(equipment_id);
```

---

## 11. Bookings Table

Stores booking records.

```sql
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  facility_id uuid not null references public.facilities(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  attendee_count integer check (attendee_count is null or attendee_count >= 0),
  status booking_status not null default 'confirmed',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_range tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  approval_required boolean not null default false,
  cancellation_reason text,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancelled_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bookings_valid_time_range check (starts_at < ends_at),
  constraint bookings_attendee_capacity check (attendee_count is null or attendee_count >= 0)
);
```

### Important Time Range Convention

The booking system should use half-open time ranges:

```txt
[start, end)
```

This means:

* A booking from 10:00 to 11:00 does not conflict with a booking from 11:00 to 12:00.
* A booking from 10:00 to 11:00 conflicts with a booking from 10:30 to 11:30.

### Indexes

```sql
create index bookings_facility_id_idx on public.bookings(facility_id);
create index bookings_user_id_idx on public.bookings(user_id);
create index bookings_status_idx on public.bookings(status);
create index bookings_starts_at_idx on public.bookings(starts_at);
create index bookings_ends_at_idx on public.bookings(ends_at);
create index bookings_facility_status_time_idx on public.bookings(facility_id, status, starts_at, ends_at);
create index bookings_time_range_gist_idx on public.bookings using gist(time_range);
```

### Critical Conflict Prevention Constraint

This prevents overlapping active bookings for the same facility.

```sql
alter table public.bookings
add constraint bookings_no_overlapping_active
exclude using gist (
  facility_id with =,
  time_range with &&
)
where (status in ('pending', 'confirmed'));
```

### Notes

* This requires the `btree_gist` extension.
* Only `pending` and `confirmed` bookings block time.
* `cancelled`, `rejected`, `completed`, and `expired` bookings do not block future bookings.
* This protects against simultaneous submissions.

---

## 12. Booking Approvals Table

Tracks approval and rejection history.

```sql
create table public.booking_approvals (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status approval_status not null default 'pending',
  requested_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Indexes

```sql
create index booking_approvals_booking_id_idx on public.booking_approvals(booking_id);
create index booking_approvals_status_idx on public.booking_approvals(status);
create index booking_approvals_requested_by_idx on public.booking_approvals(requested_by);
create index booking_approvals_reviewed_by_idx on public.booking_approvals(reviewed_by);
```

---

## 12A. Booking Invitations Table

Tracks internal attendee invitations for booking collaboration v1.

```sql
create table public.booking_invitations (
  id uuid primary key default extensions.uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  status booking_invitation_status not null default 'pending',
  response_message text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint booking_invitations_unique_invitee unique (booking_id, invited_user_id),
  constraint booking_invitations_response_message_length
    check (response_message is null or char_length(response_message) <= 500)
);
```

### Indexes

```sql
create index booking_invitations_booking_id_idx on public.booking_invitations(booking_id);
create index booking_invitations_invited_user_id_idx on public.booking_invitations(invited_user_id);
create index booking_invitations_status_idx on public.booking_invitations(status);
create index booking_invitations_created_at_idx on public.booking_invitations(created_at desc);
```

### Notes

* Only active internal users can be invited.
* Booking owners can invite and remove attendees for their own bookings.
* Invited users can accept or decline only their own pending invitations.
* Invited users can view a safe booking detail view but cannot cancel or manage the booking.
* Admins can view invitation status on admin booking detail pages.

## 12B. Calendar Visibility Setting

`system_settings` includes `calendar_visibility_mode` for employee calendar privacy.

Allowed values:

```txt
my_bookings_only
all_company_bookings
```

Default:

```txt
my_bookings_only
```

When enabled as `all_company_bookings`, employees can view company-wide room usage on `/calendar`, but unrelated bookings must expose limited details only and must not allow employee management actions.

---

## 13. Blocked Periods Table

Stores unavailable periods created by admins.

```sql
create table public.blocked_periods (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  reason text,
  scope blocked_period_scope not null default 'selected_facilities',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_range tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint blocked_periods_valid_time_range check (starts_at < ends_at)
);
```

### Indexes

```sql
create index blocked_periods_scope_idx on public.blocked_periods(scope);
create index blocked_periods_active_idx on public.blocked_periods(is_active);
create index blocked_periods_time_range_gist_idx on public.blocked_periods using gist(time_range);
```

---

## 14. Blocked Period Facilities Table

Maps selected blocked periods to specific facilities.

```sql
create table public.blocked_period_facilities (
  blocked_period_id uuid not null references public.blocked_periods(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocked_period_id, facility_id)
);
```

### Indexes

```sql
create index blocked_period_facilities_blocked_period_id_idx
on public.blocked_period_facilities(blocked_period_id);

create index blocked_period_facilities_facility_id_idx
on public.blocked_period_facilities(facility_id);
```

---

## 15. Maintenance Closures Table

Stores facility maintenance closures.

```sql
create table public.maintenance_closures (
  id uuid primary key default uuid_generate_v4(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  title text not null,
  reason text,
  status maintenance_status not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_range tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint maintenance_closures_valid_time_range check (starts_at < ends_at)
);
```

### Indexes

```sql
create index maintenance_closures_facility_id_idx on public.maintenance_closures(facility_id);
create index maintenance_closures_status_idx on public.maintenance_closures(status);
create index maintenance_closures_time_range_gist_idx on public.maintenance_closures using gist(time_range);
```

---

## 16. Email Notifications Table

Tracks queued, sent, and failed notification emails.

The `provider` field records the app notification provider used for a send attempt, such as `resend`, `smtp`, or `noop`. Provider credentials are not stored in the database; Resend and SMTP secrets are environment variables only.

```sql
create table public.email_notifications (
  id uuid primary key default uuid_generate_v4(),
  type email_notification_type not null,
  status email_notification_status not null default 'queued',
  recipient_email text not null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  body text,
  template_name text,
  template_data jsonb not null default '{}'::jsonb,
  related_booking_id uuid references public.bookings(id) on delete set null,
  provider text,
  provider_message_id text,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  last_error text,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Indexes

```sql
create index email_notifications_status_idx on public.email_notifications(status);
create index email_notifications_type_idx on public.email_notifications(type);
create index email_notifications_scheduled_for_idx on public.email_notifications(scheduled_for);
create index email_notifications_related_booking_id_idx on public.email_notifications(related_booking_id);
create index email_notifications_recipient_user_id_idx on public.email_notifications(recipient_user_id);
```

---

## 17. Audit Logs Table

Stores read-only records of important system actions.

```sql
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  action audit_action_type not null,
  entity_type audit_entity_type not null,
  entity_id uuid,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  summary text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

### Indexes

```sql
create index audit_logs_action_idx on public.audit_logs(action);
create index audit_logs_entity_type_idx on public.audit_logs(entity_type);
create index audit_logs_entity_id_idx on public.audit_logs(entity_id);
create index audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at);
```

### Notes

* Audit logs should not be editable from the application UI.
* Only admins should be able to view audit logs.
* Deleting audit logs should not be supported in the normal app.

---

## 18. System Settings Table

Stores admin-configurable settings.

```sql
create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Recommended Default Settings

```sql
insert into public.system_settings (key, value, description, is_public)
values
  ('app_name', '"Booking System"', 'Application display name', true),
  ('company_name', '"Company"', 'Company display name', true),
  ('system_contact_email', 'null', 'Main support/contact email for the system', true),
  ('registration_enabled', 'true', 'Whether users can self-register', false),
  ('allowed_email_domains', '[]', 'Allowed email domains for registration. Empty means no domain restriction.', false),
  ('default_approval_required', 'false', 'Whether bookings require approval by default', false),
  ('allow_facility_approval_override', 'true', 'Whether facilities can override approval setting', false),
  ('default_timezone', '"Asia/Kuala_Lumpur"', 'Default timezone for display', true),
  ('reminder_offsets_minutes', '[1440, 60]', 'Reminder email offsets before booking start, in minutes', false);
```

### Notes

* Do not store API keys here.
* Email provider keys must be stored in environment variables.
* Settings should be cached carefully, if needed.

---

## 19. Export Logs Table

Optional but recommended for tracking report exports.

```sql
create table public.export_logs (
  id uuid primary key default uuid_generate_v4(),
  export_type text not null,
  format text not null,
  filters jsonb not null default '{}'::jsonb,
  requested_by uuid references public.profiles(id) on delete set null,
  file_name text,
  row_count integer,
  created_at timestamptz not null default now()
);
```

### Indexes

```sql
create index export_logs_export_type_idx on public.export_logs(export_type);
create index export_logs_requested_by_idx on public.export_logs(requested_by);
create index export_logs_created_at_idx on public.export_logs(created_at);
```

---

## 20. Updated At Trigger

Most tables need automatic `updated_at` handling.

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Apply to tables with `updated_at`:

```sql
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_facilities_updated_at
before update on public.facilities
for each row execute function public.set_updated_at();

create trigger set_facility_photos_updated_at
before update on public.facility_photos
for each row execute function public.set_updated_at();

create trigger set_equipment_updated_at
before update on public.equipment
for each row execute function public.set_updated_at();

create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger set_booking_approvals_updated_at
before update on public.booking_approvals
for each row execute function public.set_updated_at();

create trigger set_blocked_periods_updated_at
before update on public.blocked_periods
for each row execute function public.set_updated_at();

create trigger set_maintenance_closures_updated_at
before update on public.maintenance_closures
for each row execute function public.set_updated_at();

create trigger set_email_notifications_updated_at
before update on public.email_notifications
for each row execute function public.set_updated_at();

create trigger set_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();
```

---

## 21. Profile Creation Trigger

Create a profile automatically when a Supabase Auth user is created.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'employee',
    'active'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

### Notes

* The first super admin may need to be promoted manually in Supabase SQL editor.
* Later, super admins can manage roles through the admin UI.

Example first-super-admin promotion:

```sql
update public.profiles
set role = 'super_admin'
where email = 'admin@example.com';
```

---

## 22. Seed Data

Seed the five default facilities.

```sql
insert into public.facilities (
  code,
  name,
  slug,
  level,
  type,
  capacity,
  description,
  status,
  requires_approval,
  display_order
)
values
  (
    'MR-L5-01',
    'Meeting Room 1',
    'meeting-room-1-level-5',
    'Level 5',
    'meeting_room',
    8,
    'Meeting Room 1 located on Level 5.',
    'active',
    null,
    1
  ),
  (
    'MR-L5-02',
    'Meeting Room 2',
    'meeting-room-2-level-5',
    'Level 5',
    'meeting_room',
    8,
    'Meeting Room 2 located on Level 5.',
    'active',
    null,
    2
  ),
  (
    'MR-L6-01',
    'Meeting Room 1',
    'meeting-room-1-level-6',
    'Level 6',
    'meeting_room',
    8,
    'Meeting Room 1 located on Level 6.',
    'active',
    null,
    3
  ),
  (
    'MR-L6-02',
    'Meeting Room 2',
    'meeting-room-2-level-6',
    'Level 6',
    'meeting_room',
    8,
    'Meeting Room 2 located on Level 6.',
    'active',
    null,
    4
  ),
  (
    'EH-L1-01',
    'Event Hall',
    'event-hall-level-1',
    'Level 1',
    'event_hall',
    100,
    'Event Hall located on Level 1.',
    'active',
    null,
    5
  );
```

Seed default equipment:

```sql
insert into public.equipment (name, description)
values
  ('Projector', 'Projector for presentations'),
  ('TV Screen', 'Display screen for presentations or video calls'),
  ('Whiteboard', 'Whiteboard for discussions'),
  ('Video Conferencing System', 'Camera and conferencing equipment'),
  ('Microphone', 'Microphone for meetings or events'),
  ('Speaker System', 'Audio speaker system'),
  ('HDMI Cable', 'HDMI cable for display connection'),
  ('Air Conditioning', 'Air-conditioned room'),
  ('Tables', 'Tables available'),
  ('Chairs', 'Chairs available')
on conflict (name) do nothing;
```

---

## 23. Booking Availability Queries

### 23.1 Check Existing Booking Conflict

```sql
select *
from public.bookings
where facility_id = :facility_id
  and status in ('pending', 'confirmed')
  and time_range && tstzrange(:starts_at, :ends_at, '[)');
```

### 23.2 Check Blocked Period Conflict

```sql
select bp.*
from public.blocked_periods bp
left join public.blocked_period_facilities bpf
  on bpf.blocked_period_id = bp.id
where bp.is_active = true
  and bp.time_range && tstzrange(:starts_at, :ends_at, '[)')
  and (
    bp.scope = 'all_facilities'
    or bpf.facility_id = :facility_id
  );
```

### 23.3 Check Maintenance Closure Conflict

```sql
select *
from public.maintenance_closures
where facility_id = :facility_id
  and status in ('scheduled', 'in_progress')
  and time_range && tstzrange(:starts_at, :ends_at, '[)');
```

---

## 24. Recommended Booking Creation Function

Use a database function for booking creation to keep conflict checks transaction-safe and centralized.

```sql
create or replace function public.create_booking(
  p_facility_id uuid,
  p_user_id uuid,
  p_created_by uuid,
  p_title text,
  p_description text,
  p_attendee_count integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_approval_required boolean
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_facility public.facilities;
  v_booking public.bookings;
  v_status booking_status;
begin
  if p_starts_at >= p_ends_at then
    raise exception 'Booking start time must be before end time.';
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
    approval_required
  )
  values (
    p_facility_id,
    p_user_id,
    p_created_by,
    p_title,
    p_description,
    p_attendee_count,
    v_status,
    p_starts_at,
    p_ends_at,
    p_approval_required
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
```

### Important Note

Even with this function, the exclusion constraint on `bookings` is still required.

The function checks availability and provides cleaner error messages.

The exclusion constraint protects against race conditions and simultaneous booking attempts.

---

## 25. Row Level Security Overview

Enable RLS on all application tables.

```sql
alter table public.profiles enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_photos enable row level security;
alter table public.equipment enable row level security;
alter table public.facility_equipment enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_approvals enable row level security;
alter table public.blocked_periods enable row level security;
alter table public.blocked_period_facilities enable row level security;
alter table public.maintenance_closures enable row level security;
alter table public.email_notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.export_logs enable row level security;
```

---

## 26. Helper Functions: Admin Roles

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text in ('admin', 'super_admin')
      and status = 'active'
  );
$$;
```

`public.is_admin()` returns true for active `admin` and `super_admin` profiles. Use it for operational admin policies.

Post-MVP role split adds a super-admin-only helper:

```sql
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text = 'super_admin'
      and status = 'active'
  );
$$;
```

Use `public.is_super_admin()` for user/role management and system settings policies.

---

## 27. Helper Function: Is Active User

```sql
create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  );
$$;
```

---

## 28. Suggested RLS Policies

These policies are a starting point. Review and harden them during implementation.

### 28.1 Profiles

```sql
create policy "Users can view their own profile"
on public.profiles
for select
using (id = auth.uid());

create policy "Admins can view all profiles"
on public.profiles
for select
using (public.is_admin());

create policy "Users can update their own basic profile"
on public.profiles
for update
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = role
);

create policy "Super admins can update profiles"
on public.profiles
for update
using (public.is_super_admin())
with check (public.is_super_admin());
```

### 28.2 Facilities

```sql
create policy "Active users can view active facilities"
on public.facilities
for select
using (
  public.is_active_user()
  and status in ('active', 'under_maintenance')
  and is_archived = false
);

create policy "Admins can view all facilities"
on public.facilities
for select
using (public.is_admin());

create policy "Admins can insert facilities"
on public.facilities
for insert
with check (public.is_admin());

create policy "Admins can update facilities"
on public.facilities
for update
using (public.is_admin())
with check (public.is_admin());
```

### 28.3 Facility Photos

```sql
create policy "Active users can view facility photos"
on public.facility_photos
for select
using (public.is_active_user());

create policy "Admins can manage facility photos"
on public.facility_photos
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.4 Equipment

```sql
create policy "Active users can view equipment"
on public.equipment
for select
using (public.is_active_user());

create policy "Admins can manage equipment"
on public.equipment
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.5 Facility Equipment

```sql
create policy "Active users can view facility equipment"
on public.facility_equipment
for select
using (public.is_active_user());

create policy "Admins can manage facility equipment"
on public.facility_equipment
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.6 Bookings

```sql
create policy "Users can view their own bookings"
on public.bookings
for select
using (user_id = auth.uid());

create policy "Admins can view all bookings"
on public.bookings
for select
using (public.is_admin());

create policy "Active users can create own bookings"
on public.bookings
for insert
with check (
  public.is_active_user()
  and user_id = auth.uid()
);

create policy "Users can update their own bookings for cancellation"
on public.bookings
for update
using (
  user_id = auth.uid()
  and status in ('pending', 'confirmed')
)
with check (
  user_id = auth.uid()
);

create policy "Admins can manage all bookings"
on public.bookings
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.7 Booking Approvals

```sql
create policy "Users can view approvals for own bookings"
on public.booking_approvals
for select
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_approvals.booking_id
      and b.user_id = auth.uid()
  )
);

create policy "Admins can manage booking approvals"
on public.booking_approvals
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.8 Blocked Periods

```sql
create policy "Active users can view active blocked periods"
on public.blocked_periods
for select
using (
  public.is_active_user()
  and is_active = true
);

create policy "Admins can manage blocked periods"
on public.blocked_periods
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.9 Blocked Period Facilities

```sql
create policy "Active users can view blocked period facilities"
on public.blocked_period_facilities
for select
using (public.is_active_user());

create policy "Admins can manage blocked period facilities"
on public.blocked_period_facilities
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.10 Maintenance Closures

```sql
create policy "Active users can view active maintenance closures"
on public.maintenance_closures
for select
using (
  public.is_active_user()
  and status in ('scheduled', 'in_progress')
);

create policy "Admins can manage maintenance closures"
on public.maintenance_closures
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.11 Email Notifications

```sql
create policy "Admins can view email notifications"
on public.email_notifications
for select
using (public.is_admin());

create policy "Admins can manage email notifications"
on public.email_notifications
for all
using (public.is_admin())
with check (public.is_admin());
```

### 28.12 Audit Logs

```sql
create policy "Admins can view audit logs"
on public.audit_logs
for select
using (public.is_admin());

create policy "Admins can insert audit logs"
on public.audit_logs
for insert
with check (public.is_admin());
```

### 28.13 System Settings

```sql
create policy "Active users can view public settings"
on public.system_settings
for select
using (
  public.is_active_user()
  and is_public = true
);

create policy "Super admins can view all settings"
on public.system_settings
for select
using (public.is_super_admin());

create policy "Super admins can manage settings"
on public.system_settings
for all
using (public.is_super_admin())
with check (public.is_super_admin());
```

### 28.14 Export Logs

```sql
create policy "Admins can manage export logs"
on public.export_logs
for all
using (public.is_admin())
with check (public.is_admin());
```

---

## 29. Supabase Storage

Use Supabase Storage for facility photos.

### Bucket

```txt
facility-photos
```

### Recommended Storage Rules

Option A: Public facility photos

* Use a public bucket.
* Store public URL in `facility_photos.public_url`.
* Suitable if room photos are not sensitive.

Option B: Private facility photos

* Use a private bucket.
* Generate signed URLs.
* More secure for internal-only applications.

For an internal company system, private storage is more secure, but public storage is simpler.

### Suggested Path Format

```txt
facilities/{facility_id}/{photo_id}-{filename}
```

---

## 30. Reporting Query Examples

### 30.1 Booking History Report

```sql
select
  b.id,
  f.name as facility_name,
  f.level,
  f.type,
  p.full_name as user_name,
  p.email as user_email,
  b.title,
  b.status,
  b.starts_at,
  b.ends_at,
  extract(epoch from (b.ends_at - b.starts_at)) / 3600 as duration_hours,
  b.created_at
from public.bookings b
join public.facilities f on f.id = b.facility_id
join public.profiles p on p.id = b.user_id
where b.starts_at >= :date_from
  and b.starts_at < :date_to
order by b.starts_at desc;
```

### 30.2 Facility Utilization Report

```sql
select
  f.id,
  f.name,
  f.level,
  f.type,
  count(b.id) as total_bookings,
  coalesce(sum(extract(epoch from (b.ends_at - b.starts_at)) / 3600), 0) as total_booked_hours
from public.facilities f
left join public.bookings b
  on b.facility_id = f.id
  and b.status in ('confirmed', 'completed')
  and b.starts_at >= :date_from
  and b.starts_at < :date_to
group by f.id, f.name, f.level, f.type
order by total_booked_hours desc;
```

### 30.3 Most Active Users Report

```sql
select
  p.id,
  p.full_name,
  p.email,
  count(b.id) as total_bookings,
  coalesce(sum(extract(epoch from (b.ends_at - b.starts_at)) / 3600), 0) as total_booked_hours
from public.profiles p
join public.bookings b on b.user_id = p.id
where b.starts_at >= :date_from
  and b.starts_at < :date_to
group by p.id, p.full_name, p.email
order by total_bookings desc;
```

---

## 31. Migration File Recommendation

Suggested migration files:

```txt
supabase/migrations/
├─ 0001_extensions.sql
├─ 0002_enums.sql
├─ 0003_core_tables.sql
├─ 0004_indexes.sql
├─ 0005_functions_triggers.sql
├─ 0006_rls_policies.sql
├─ 0007_storage_policies.sql
└─ 0008_seed_data.sql
```

For the first implementation, Codex may create one large migration, but splitting migrations is cleaner and easier to review.

---

## 32. Data Access Layer Recommendation

The app should avoid scattering raw Supabase queries throughout UI components.

Recommended folders:

```txt
lib/
├─ bookings/
│  ├─ queries.ts
│  ├─ actions.ts
│  ├─ availability.ts
│  └─ validation.ts
├─ facilities/
│  ├─ queries.ts
│  ├─ actions.ts
│  └─ validation.ts
├─ users/
│  ├─ queries.ts
│  └─ actions.ts
├─ reports/
│  ├─ queries.ts
│  └─ export.ts
├─ audit/
│  └─ log.ts
└─ settings/
   ├─ queries.ts
   └─ actions.ts
```

---

## 33. Important Implementation Notes for Codex

1. Do not rely only on frontend checks for booking availability.
2. Always keep the database exclusion constraint for active booking conflicts.
3. Use `timestamptz` for booking times.
4. Use `[start, end)` time ranges.
5. Use RLS for all user-accessible tables.
6. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
7. Keep service role usage server-only.
8. Use `profiles.role` for app authorization.
9. Add audit logs for critical admin and booking actions.
10. Treat email sending as a queue/history system, not just a direct function call.
11. Store email provider API keys only in environment variables.
12. Use seed data for the initial five facilities.
13. The first super admin can be manually promoted through SQL.
14. Add indexes before building reports.
15. Run `npm run build` after implementing database-dependent TypeScript code.

---

## 34. Definition of Done

The database schema is complete when:

1. All required tables exist.
2. All required enum types exist.
3. The five default facilities are seeded.
4. Equipment seed data exists.
5. Supabase Auth users automatically receive profiles.
6. User roles are supported.
7. Booking statuses are supported.
8. Facility statuses are supported.
9. Booking conflict prevention works at database level.
10. Blocked periods can prevent bookings.
11. Maintenance closures can prevent bookings.
12. Approval records can be created.
13. Email notification records can be created.
14. Audit logs can be created.
15. System settings can be stored.
16. Reports can query booking history.
17. RLS is enabled on application tables.
18. Employee and admin policies are implemented.
19. Storage for facility photos is configured.
20. The schema can be applied successfully to Supabase.

```
```
