do $$
begin
  create type public.booking_invitation_status as enum (
    'pending',
    'accepted',
    'declined',
    'removed'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.email_notification_type add value if not exists 'booking_invitation';
alter type public.email_notification_type add value if not exists 'booking_invitation_accepted';
alter type public.email_notification_type add value if not exists 'booking_invitation_declined';

create table if not exists public.booking_invitations (
  id uuid primary key default extensions.uuid_generate_v4(),
  booking_id uuid not null
    constraint booking_invitations_booking_id_fkey
    references public.bookings(id) on delete cascade,
  invited_user_id uuid not null
    constraint booking_invitations_invited_user_id_fkey
    references public.profiles(id) on delete cascade,
  invited_by uuid not null
    constraint booking_invitations_invited_by_fkey
    references public.profiles(id) on delete restrict,
  status public.booking_invitation_status not null default 'pending',
  response_message text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint booking_invitations_unique_invitee unique (booking_id, invited_user_id),
  constraint booking_invitations_response_message_length
    check (response_message is null or char_length(response_message) <= 500)
);

create index if not exists booking_invitations_booking_id_idx
on public.booking_invitations(booking_id);

create index if not exists booking_invitations_invited_user_id_idx
on public.booking_invitations(invited_user_id);

create index if not exists booking_invitations_status_idx
on public.booking_invitations(status);

create index if not exists booking_invitations_created_at_idx
on public.booking_invitations(created_at desc);

drop trigger if exists set_booking_invitations_updated_at on public.booking_invitations;
create trigger set_booking_invitations_updated_at
before update on public.booking_invitations
for each row execute function public.set_updated_at();

alter table public.booking_invitations enable row level security;

grant select, insert, update, delete on public.booking_invitations to authenticated;

drop policy if exists "Admins can manage booking invitations" on public.booking_invitations;
create policy "Admins can manage booking invitations"
on public.booking_invitations
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Booking owners can view invitations" on public.booking_invitations;
create policy "Booking owners can view invitations"
on public.booking_invitations
for select
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_invitations.booking_id
      and b.user_id = auth.uid()
  )
);

drop policy if exists "Invited users can view own invitations" on public.booking_invitations;
create policy "Invited users can view own invitations"
on public.booking_invitations
for select
using (invited_user_id = auth.uid());

drop policy if exists "Booking owners can invite active users" on public.booking_invitations;
create policy "Booking owners can invite active users"
on public.booking_invitations
for insert
with check (
  public.is_active_user()
  and invited_by = auth.uid()
  and exists (
    select 1
    from public.bookings b
    where b.id = booking_invitations.booking_id
      and b.user_id = auth.uid()
      and b.user_id <> booking_invitations.invited_user_id
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = booking_invitations.invited_user_id
      and p.status = 'active'
  )
);

drop policy if exists "Invited users can respond to own invitations" on public.booking_invitations;
create policy "Invited users can respond to own invitations"
on public.booking_invitations
for update
using (
  public.is_active_user()
  and invited_user_id = auth.uid()
  and status = 'pending'
)
with check (
  invited_user_id = auth.uid()
  and status in ('accepted', 'declined')
);

drop policy if exists "Booking owners can remove invitations" on public.booking_invitations;
create policy "Booking owners can remove invitations"
on public.booking_invitations
for delete
using (
  public.is_active_user()
  and exists (
    select 1
    from public.bookings b
    where b.id = booking_invitations.booking_id
      and b.user_id = auth.uid()
  )
);

drop policy if exists "Invited users can view invited bookings" on public.bookings;
create policy "Invited users can view invited bookings"
on public.bookings
for select
using (
  public.is_active_user()
  and exists (
    select 1
    from public.booking_invitations bi
    where bi.booking_id = bookings.id
      and bi.invited_user_id = auth.uid()
      and bi.status in ('pending', 'accepted', 'declined')
  )
);
