create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "btree_gist" with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'employee',
  status public.user_status not null default 'active',
  department text,
  phone text,
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facilities (
  id uuid primary key default extensions.uuid_generate_v4(),
  code text not null unique,
  name text not null,
  slug text not null unique,
  level text not null,
  type public.facility_type not null,
  capacity integer not null check (capacity > 0),
  description text,
  status public.facility_status not null default 'active',
  requires_approval boolean,
  display_order integer not null default 0,
  is_archived boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facility_photos (
  id uuid primary key default extensions.uuid_generate_v4(),
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

create table if not exists public.equipment (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null unique,
  description text,
  icon_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facility_equipment (
  facility_id uuid not null references public.facilities(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  created_at timestamptz not null default now(),
  primary key (facility_id, equipment_id)
);

create table if not exists public.bookings (
  id uuid primary key default extensions.uuid_generate_v4(),
  facility_id uuid not null references public.facilities(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  attendee_count integer check (attendee_count is null or attendee_count >= 0),
  status public.booking_status not null default 'confirmed',
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

create table if not exists public.booking_approvals (
  id uuid primary key default extensions.uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status public.approval_status not null default 'pending',
  requested_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blocked_periods (
  id uuid primary key default extensions.uuid_generate_v4(),
  title text not null,
  reason text,
  scope public.blocked_period_scope not null default 'selected_facilities',
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

create table if not exists public.blocked_period_facilities (
  blocked_period_id uuid not null references public.blocked_periods(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocked_period_id, facility_id)
);

create table if not exists public.maintenance_closures (
  id uuid primary key default extensions.uuid_generate_v4(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  title text not null,
  reason text,
  status public.maintenance_status not null default 'scheduled',
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

create table if not exists public.email_notifications (
  id uuid primary key default extensions.uuid_generate_v4(),
  type public.email_notification_type not null,
  status public.email_notification_status not null default 'queued',
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

create table if not exists public.audit_logs (
  id uuid primary key default extensions.uuid_generate_v4(),
  action public.audit_action_type not null,
  entity_type public.audit_entity_type not null,
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

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.export_logs (
  id uuid primary key default extensions.uuid_generate_v4(),
  report_type text not null,
  filters jsonb not null default '{}'::jsonb,
  exported_by uuid references public.profiles(id) on delete set null,
  file_name text,
  row_count integer check (row_count is null or row_count >= 0),
  created_at timestamptz not null default now()
);
