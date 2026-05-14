create table if not exists public.booking_calendar_syncs (
  id uuid primary key default extensions.uuid_generate_v4(),
  booking_id uuid not null
    constraint booking_calendar_syncs_booking_id_fkey
    references public.bookings(id) on delete cascade,
  provider text not null default 'microsoft_365',
  external_calendar_id text,
  external_event_id text,
  sync_status text not null default 'pending',
  sync_direction text not null default 'outbound',
  last_synced_at timestamptz,
  last_error text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint booking_calendar_syncs_booking_provider_unique
    unique (booking_id, provider),
  constraint booking_calendar_syncs_provider_check
    check (provider = 'microsoft_365'),
  constraint booking_calendar_syncs_status_check
    check (sync_status in ('pending', 'synced', 'failed', 'skipped', 'cancelled')),
  constraint booking_calendar_syncs_direction_check
    check (sync_direction = 'outbound'),
  constraint booking_calendar_syncs_attempts_check
    check (attempts >= 0),
  constraint booking_calendar_syncs_last_error_length
    check (last_error is null or char_length(last_error) <= 2000)
);

create index if not exists booking_calendar_syncs_booking_id_idx
on public.booking_calendar_syncs(booking_id);

create index if not exists booking_calendar_syncs_sync_status_idx
on public.booking_calendar_syncs(sync_status);

create index if not exists booking_calendar_syncs_provider_idx
on public.booking_calendar_syncs(provider);

create index if not exists booking_calendar_syncs_last_synced_at_idx
on public.booking_calendar_syncs(last_synced_at desc);

drop trigger if exists set_booking_calendar_syncs_updated_at
on public.booking_calendar_syncs;
create trigger set_booking_calendar_syncs_updated_at
before update on public.booking_calendar_syncs
for each row execute function public.set_updated_at();

alter table public.booking_calendar_syncs enable row level security;

grant select, insert, update, delete on public.booking_calendar_syncs to authenticated;

drop policy if exists "Admins can view booking calendar syncs"
on public.booking_calendar_syncs;
create policy "Admins can view booking calendar syncs"
on public.booking_calendar_syncs
for select
using (public.is_admin());

drop policy if exists "Super admins can manage booking calendar syncs"
on public.booking_calendar_syncs;
create policy "Super admins can manage booking calendar syncs"
on public.booking_calendar_syncs
for all
using (public.is_super_admin())
with check (public.is_super_admin());

comment on table public.booking_calendar_syncs is
  'Tracks future outbound Microsoft 365 Calendar sync state for bookings. This groundwork table does not create Microsoft Graph events by itself.';

comment on column public.booking_calendar_syncs.last_error is
  'Sanitized provider error summary only. Do not store Microsoft client secrets, access tokens, or raw stack traces.';
