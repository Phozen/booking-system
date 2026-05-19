create table if not exists public.booking_waitlist_requests (
  id uuid primary key default extensions.uuid_generate_v4(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  requested_starts_at timestamptz not null,
  requested_ends_at timestamptz not null,
  attendee_count integer check (attendee_count is null or attendee_count >= 0),
  reason text,
  status text not null default 'open',
  admin_response text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint booking_waitlist_valid_time_range
    check (requested_starts_at < requested_ends_at),
  constraint booking_waitlist_status_check
    check (status in ('open', 'suggested_alternative', 'closed', 'cancelled'))
);

create index if not exists booking_waitlist_requester_id_idx
on public.booking_waitlist_requests(requester_id);

create index if not exists booking_waitlist_facility_id_idx
on public.booking_waitlist_requests(facility_id);

create index if not exists booking_waitlist_status_idx
on public.booking_waitlist_requests(status);

create index if not exists booking_waitlist_requested_starts_at_idx
on public.booking_waitlist_requests(requested_starts_at);

drop trigger if exists set_booking_waitlist_requests_updated_at
on public.booking_waitlist_requests;

create trigger set_booking_waitlist_requests_updated_at
before update on public.booking_waitlist_requests
for each row
execute function public.set_updated_at();

alter table public.booking_waitlist_requests enable row level security;

grant select, insert, update, delete on public.booking_waitlist_requests to authenticated;

drop policy if exists "Users can view their own waitlist requests"
on public.booking_waitlist_requests;

create policy "Users can view their own waitlist requests"
on public.booking_waitlist_requests
for select
using (requester_id = auth.uid());

drop policy if exists "Active users can create own waitlist requests"
on public.booking_waitlist_requests;

create policy "Active users can create own waitlist requests"
on public.booking_waitlist_requests
for insert
with check (
  public.is_active_user()
  and requester_id = auth.uid()
);

drop policy if exists "Users can cancel own open waitlist requests"
on public.booking_waitlist_requests;

create policy "Users can cancel own open waitlist requests"
on public.booking_waitlist_requests
for update
using (
  requester_id = auth.uid()
  and status in ('open', 'suggested_alternative')
)
with check (
  requester_id = auth.uid()
  and status in ('cancelled', 'open', 'suggested_alternative')
);

drop policy if exists "Admins can manage waitlist requests"
on public.booking_waitlist_requests;

create policy "Admins can manage waitlist requests"
on public.booking_waitlist_requests
for all
using (public.is_admin())
with check (public.is_admin());

comment on table public.booking_waitlist_requests is
  'Non-reserving waitlist and alternative facility requests for unavailable slots.';
