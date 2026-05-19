create table if not exists public.user_notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  booking_reminders_enabled boolean not null default true,
  invitation_updates_enabled boolean not null default true,
  reminder_offsets_minutes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_notification_preferences_offsets_array_check
    check (
      reminder_offsets_minutes is null
      or jsonb_typeof(reminder_offsets_minutes) = 'array'
    )
);

drop trigger if exists set_user_notification_preferences_updated_at
on public.user_notification_preferences;

create trigger set_user_notification_preferences_updated_at
before update on public.user_notification_preferences
for each row
execute function public.set_updated_at();

alter table public.user_notification_preferences enable row level security;

grant select, insert, update, delete on public.user_notification_preferences to authenticated;

drop policy if exists "Users can manage their own notification preferences"
on public.user_notification_preferences;

create policy "Users can manage their own notification preferences"
on public.user_notification_preferences
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can view notification preferences"
on public.user_notification_preferences;

create policy "Admins can view notification preferences"
on public.user_notification_preferences
for select
using (public.is_admin());

comment on table public.user_notification_preferences is
  'User-controlled preferences for non-critical booking notifications.';
