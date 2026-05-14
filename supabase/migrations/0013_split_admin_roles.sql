alter type public.user_role add value if not exists 'super_admin';

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

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Super admins can update profiles"
on public.profiles
for update
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Admins can view all settings" on public.system_settings;
create policy "Super admins can view all settings"
on public.system_settings
for select
using (public.is_super_admin());

drop policy if exists "Admins can manage settings" on public.system_settings;
create policy "Super admins can manage settings"
on public.system_settings
for all
using (public.is_super_admin())
with check (public.is_super_admin());

comment on function public.is_admin() is
  'Returns true for active admin and super_admin profiles.';

comment on function public.is_super_admin() is
  'Returns true only for active super_admin profiles.';

comment on type public.user_role is
  'Application roles: employee, admin, and super_admin. Promote the first super admin manually: update public.profiles set role = ''super_admin'' where email = ''YOUR_EMAIL_HERE'';';
