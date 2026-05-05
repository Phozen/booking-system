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

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
using (public.is_admin());

drop policy if exists "Users can update their own basic profile" on public.profiles;
create policy "Users can update their own basic profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Active users can view active facilities" on public.facilities;
create policy "Active users can view active facilities"
on public.facilities
for select
using (
  public.is_active_user()
  and status in ('active', 'under_maintenance')
  and is_archived = false
);

drop policy if exists "Admins can view all facilities" on public.facilities;
create policy "Admins can view all facilities"
on public.facilities
for select
using (public.is_admin());

drop policy if exists "Admins can insert facilities" on public.facilities;
create policy "Admins can insert facilities"
on public.facilities
for insert
with check (public.is_admin());

drop policy if exists "Admins can update facilities" on public.facilities;
create policy "Admins can update facilities"
on public.facilities
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Active users can view facility photos" on public.facility_photos;
create policy "Active users can view facility photos"
on public.facility_photos
for select
using (public.is_active_user());

drop policy if exists "Admins can manage facility photos" on public.facility_photos;
create policy "Admins can manage facility photos"
on public.facility_photos
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Active users can view equipment" on public.equipment;
create policy "Active users can view equipment"
on public.equipment
for select
using (public.is_active_user());

drop policy if exists "Admins can manage equipment" on public.equipment;
create policy "Admins can manage equipment"
on public.equipment
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Active users can view facility equipment" on public.facility_equipment;
create policy "Active users can view facility equipment"
on public.facility_equipment
for select
using (public.is_active_user());

drop policy if exists "Admins can manage facility equipment" on public.facility_equipment;
create policy "Admins can manage facility equipment"
on public.facility_equipment
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can view their own bookings" on public.bookings;
create policy "Users can view their own bookings"
on public.bookings
for select
using (user_id = auth.uid());

drop policy if exists "Admins can view all bookings" on public.bookings;
create policy "Admins can view all bookings"
on public.bookings
for select
using (public.is_admin());

drop policy if exists "Active users can create own bookings" on public.bookings;
create policy "Active users can create own bookings"
on public.bookings
for insert
with check (
  public.is_active_user()
  and user_id = auth.uid()
);

drop policy if exists "Users can update their own bookings for cancellation" on public.bookings;
create policy "Users can update their own bookings for cancellation"
on public.bookings
for update
using (
  user_id = auth.uid()
  and status in ('pending', 'confirmed')
)
with check (user_id = auth.uid());

drop policy if exists "Admins can manage all bookings" on public.bookings;
create policy "Admins can manage all bookings"
on public.bookings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can view approvals for own bookings" on public.booking_approvals;
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

drop policy if exists "Admins can manage booking approvals" on public.booking_approvals;
create policy "Admins can manage booking approvals"
on public.booking_approvals
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Active users can view active blocked periods" on public.blocked_periods;
create policy "Active users can view active blocked periods"
on public.blocked_periods
for select
using (
  public.is_active_user()
  and is_active = true
);

drop policy if exists "Admins can manage blocked periods" on public.blocked_periods;
create policy "Admins can manage blocked periods"
on public.blocked_periods
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Active users can view blocked period facilities" on public.blocked_period_facilities;
create policy "Active users can view blocked period facilities"
on public.blocked_period_facilities
for select
using (public.is_active_user());

drop policy if exists "Admins can manage blocked period facilities" on public.blocked_period_facilities;
create policy "Admins can manage blocked period facilities"
on public.blocked_period_facilities
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Active users can view active maintenance closures" on public.maintenance_closures;
create policy "Active users can view active maintenance closures"
on public.maintenance_closures
for select
using (
  public.is_active_user()
  and status in ('scheduled', 'in_progress')
);

drop policy if exists "Admins can manage maintenance closures" on public.maintenance_closures;
create policy "Admins can manage maintenance closures"
on public.maintenance_closures
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view email notifications" on public.email_notifications;
create policy "Admins can view email notifications"
on public.email_notifications
for select
using (public.is_admin());

drop policy if exists "Admins can manage email notifications" on public.email_notifications;
create policy "Admins can manage email notifications"
on public.email_notifications
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
on public.audit_logs
for select
using (public.is_admin());

drop policy if exists "Admins can insert audit logs" on public.audit_logs;
create policy "Admins can insert audit logs"
on public.audit_logs
for insert
with check (public.is_admin());

drop policy if exists "Active users can view public settings" on public.system_settings;
create policy "Active users can view public settings"
on public.system_settings
for select
using (
  public.is_active_user()
  and is_public = true
);

drop policy if exists "Admins can view all settings" on public.system_settings;
create policy "Admins can view all settings"
on public.system_settings
for select
using (public.is_admin());

drop policy if exists "Admins can manage settings" on public.system_settings;
create policy "Admins can manage settings"
on public.system_settings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage export logs" on public.export_logs;
create policy "Admins can manage export logs"
on public.export_logs
for all
using (public.is_admin())
with check (public.is_admin());
