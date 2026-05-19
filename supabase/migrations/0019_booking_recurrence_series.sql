create table if not exists public.booking_recurrence_series (
  id uuid primary key default extensions.uuid_generate_v4(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  facility_id uuid not null references public.facilities(id) on delete restrict,
  title text not null,
  description text,
  frequency text not null,
  interval_count integer not null default 1 check (interval_count > 0),
  starts_on date not null,
  ends_on date,
  occurrence_count integer check (occurrence_count is null or occurrence_count > 0),
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint booking_recurrence_frequency_check
    check (frequency in ('daily', 'weekly', 'monthly')),
  constraint booking_recurrence_status_check
    check (status in ('active', 'cancelled', 'completed')),
  constraint booking_recurrence_end_check
    check (ends_on is not null or occurrence_count is not null)
);

alter table public.bookings
  add column if not exists recurrence_series_id uuid
  references public.booking_recurrence_series(id) on delete set null,
  add column if not exists recurrence_sequence integer
  check (recurrence_sequence is null or recurrence_sequence > 0);

create index if not exists booking_recurrence_series_owner_idx
on public.booking_recurrence_series(owner_user_id);

create index if not exists booking_recurrence_series_facility_idx
on public.booking_recurrence_series(facility_id);

create index if not exists booking_recurrence_series_status_idx
on public.booking_recurrence_series(status);

create index if not exists bookings_recurrence_series_id_idx
on public.bookings(recurrence_series_id);

drop trigger if exists set_booking_recurrence_series_updated_at
on public.booking_recurrence_series;

create trigger set_booking_recurrence_series_updated_at
before update on public.booking_recurrence_series
for each row
execute function public.set_updated_at();

alter table public.booking_recurrence_series enable row level security;

grant select, insert, update, delete on public.booking_recurrence_series to authenticated;

drop policy if exists "Users can view their own recurrence series"
on public.booking_recurrence_series;

create policy "Users can view their own recurrence series"
on public.booking_recurrence_series
for select
using (owner_user_id = auth.uid());

drop policy if exists "Active users can create own recurrence series"
on public.booking_recurrence_series;

create policy "Active users can create own recurrence series"
on public.booking_recurrence_series
for insert
with check (
  public.is_active_user()
  and owner_user_id = auth.uid()
);

drop policy if exists "Users can update their own active recurrence series"
on public.booking_recurrence_series;

create policy "Users can update their own active recurrence series"
on public.booking_recurrence_series
for update
using (
  owner_user_id = auth.uid()
  and status = 'active'
)
with check (owner_user_id = auth.uid());

drop policy if exists "Admins can manage recurrence series"
on public.booking_recurrence_series;

create policy "Admins can manage recurrence series"
on public.booking_recurrence_series
for all
using (public.is_admin())
with check (public.is_admin());

comment on table public.booking_recurrence_series is
  'Parent records for generated recurring booking occurrences.';
