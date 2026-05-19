alter table public.bookings
  add column if not exists usage_status text not null default 'not_tracked',
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references public.profiles(id) on delete set null,
  add column if not exists no_show_marked_at timestamptz,
  add column if not exists no_show_marked_by uuid references public.profiles(id) on delete set null;

do $$
begin
  alter table public.bookings
    add constraint bookings_usage_status_check
    check (usage_status in ('not_tracked', 'checked_in', 'no_show'));
exception
  when duplicate_object then null;
end $$;

create index if not exists bookings_usage_status_idx
on public.bookings(usage_status);

create index if not exists bookings_checked_in_at_idx
on public.bookings(checked_in_at desc);

create index if not exists bookings_no_show_marked_at_idx
on public.bookings(no_show_marked_at desc);

comment on column public.bookings.usage_status is
  'Operational usage status for confirmed booking attendance tracking.';

comment on column public.bookings.checked_in_at is
  'Timestamp when the booking was marked as checked in.';

comment on column public.bookings.no_show_marked_at is
  'Timestamp when the booking was marked as no-show.';
