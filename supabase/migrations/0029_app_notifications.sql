create table if not exists public.app_notifications (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  related_booking_id uuid references public.bookings(id) on delete set null,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint app_notifications_type_check check (
    type in (
      'booking_confirmation',
      'booking_approval',
      'booking_rejection',
      'booking_cancellation',
      'booking_invitation',
      'booking_invitation_accepted',
      'booking_invitation_declined'
    )
  )
);

create index if not exists app_notifications_user_created_idx
on public.app_notifications(user_id, created_at desc);

create index if not exists app_notifications_user_unseen_idx
on public.app_notifications(user_id, seen_at)
where seen_at is null;

create unique index if not exists app_notifications_booking_event_unique_idx
on public.app_notifications(user_id, type, related_booking_id)
where related_booking_id is not null;

drop trigger if exists set_app_notifications_updated_at
on public.app_notifications;

create trigger set_app_notifications_updated_at
before update on public.app_notifications
for each row execute function public.set_updated_at();

alter table public.app_notifications enable row level security;

grant select, insert, update, delete on public.app_notifications to authenticated;

drop policy if exists "Users can view their own app notifications"
on public.app_notifications;

create policy "Users can view their own app notifications"
on public.app_notifications
for select
using (user_id = auth.uid());

drop policy if exists "Users can mark their own app notifications"
on public.app_notifications;

create policy "Users can mark their own app notifications"
on public.app_notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can manage app notifications"
on public.app_notifications;

create policy "Admins can manage app notifications"
on public.app_notifications
for all
using (public.is_admin())
with check (public.is_admin());
