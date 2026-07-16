-- Production access control: Microsoft-only authentication backed by an exact-email
-- pre-provisioning allowlist. The allowlist is independent of auth.users so IT can
-- provision an employee before their first Microsoft sign-in.

create table if not exists public.microsoft_access_config (
  singleton boolean primary key default true check (singleton),
  tenant_id uuid not null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approved_users (
  id uuid primary key default extensions.uuid_generate_v4(),
  email text not null,
  normalized_email text generated always as (lower(btrim(email))) stored,
  role public.user_role not null default 'employee',
  status public.user_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint approved_users_email_not_blank check (length(btrim(email)) > 3),
  constraint approved_users_email_normalized_unique unique (normalized_email)
);

comment on table public.approved_users is
  'Authoritative pre-auth access list. A matching domain alone never grants access.';

comment on table public.microsoft_access_config is
  'Singleton Microsoft Entra tenant required by the before-user-created auth hook.';

drop trigger if exists set_approved_users_updated_at on public.approved_users;
create trigger set_approved_users_updated_at
before update on public.approved_users
for each row execute function public.set_updated_at();

drop trigger if exists set_microsoft_access_config_updated_at on public.microsoft_access_config;
create trigger set_microsoft_access_config_updated_at
before update on public.microsoft_access_config
for each row execute function public.set_updated_at();

alter table public.approved_users enable row level security;
alter table public.microsoft_access_config enable row level security;

revoke all on table public.approved_users from anon, authenticated;
revoke all on table public.microsoft_access_config from anon, authenticated;

grant select, insert, update, delete on table public.approved_users to authenticated;
grant select, insert, update on table public.microsoft_access_config to authenticated;

-- Resolve the trusted provider identity from auth.users/app_metadata. raw_app_meta_data
-- is controlled by Supabase Auth; raw_user_meta_data is deliberately not used here.
create or replace function public.has_active_approved_access(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    join auth.identities i
      on i.user_id = u.id
      and i.provider = 'azure'
    join public.approved_users au
      on au.normalized_email = lower(btrim(u.email))
    join public.microsoft_access_config mac
      on mac.singleton = true
    where u.id = p_user_id
      and p_user_id = auth.uid()
      and u.raw_app_meta_data->>'provider' = 'azure'
      and au.status = 'active'
      and lower(mac.tenant_id::text) = lower(
        coalesce(
          nullif(btrim(i.identity_data->>'tid'), ''),
          substring(i.identity_data->>'iss' from '(?i)login[.]microsoftonline[.]com/([0-9a-f-]{36})'),
          substring(i.identity_data->>'iss' from '(?i)sts[.]windows[.]net/([0-9a-f-]{36})')
        )
      )
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_active_approved_access(auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    join public.approved_users au
      on au.normalized_email = lower(btrim(u.email))
    where u.id = auth.uid()
      and u.raw_app_meta_data->>'provider' = 'azure'
      and au.status = 'active'
      and au.role::text in ('admin', 'super_admin')
      and public.has_active_approved_access(auth.uid())
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    join public.approved_users au
      on au.normalized_email = lower(btrim(u.email))
    where u.id = auth.uid()
      and u.raw_app_meta_data->>'provider' = 'azure'
      and au.status = 'active'
      and au.role::text = 'super_admin'
      and public.has_active_approved_access(auth.uid())
  );
$$;

revoke execute on function public.has_active_approved_access(uuid) from public, anon;
revoke execute on function public.is_active_user() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.has_active_approved_access(uuid) to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

drop policy if exists "Users can view their own approved access" on public.approved_users;
create policy "Users can view their own approved access"
on public.approved_users
for select
to authenticated
using (
  normalized_email = lower(btrim(coalesce(auth.jwt()->>'email', '')))
);

drop policy if exists "Super admins can view approved users" on public.approved_users;
create policy "Super admins can view approved users"
on public.approved_users
for select
to authenticated
using (public.is_super_admin());

drop policy if exists "Super admins can insert approved users" on public.approved_users;
create policy "Super admins can insert approved users"
on public.approved_users
for insert
to authenticated
with check (public.is_super_admin());

drop policy if exists "Super admins can update approved users" on public.approved_users;
create policy "Super admins can update approved users"
on public.approved_users
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admins can delete approved users" on public.approved_users;
create policy "Super admins can delete approved users"
on public.approved_users
for delete
to authenticated
using (public.is_super_admin());

drop policy if exists "Super admins can view Microsoft access config" on public.microsoft_access_config;
create policy "Super admins can view Microsoft access config"
on public.microsoft_access_config
for select
to authenticated
using (public.is_super_admin());

drop policy if exists "Super admins can insert Microsoft access config" on public.microsoft_access_config;
create policy "Super admins can insert Microsoft access config"
on public.microsoft_access_config
for insert
to authenticated
with check (public.is_super_admin());

drop policy if exists "Super admins can update Microsoft access config" on public.microsoft_access_config;
create policy "Super admins can update Microsoft access config"
on public.microsoft_access_config
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- The before-user-created hook receives provider-supplied metadata before the
-- auth.users row exists. Extract the Entra tenant from the tid claim or issuer.
create or replace function public.microsoft_tenant_from_metadata(p_metadata jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(
    coalesce(
      nullif(btrim(p_metadata->>'tid'), ''),
      substring(p_metadata->>'iss' from '(?i)login[.]microsoftonline[.]com/([0-9a-f-]{36})'),
      substring(p_metadata->>'iss' from '(?i)sts[.]windows[.]net/([0-9a-f-]{36})')
    )
  );
$$;

create or replace function public.hook_enforce_preprovisioned_microsoft_access(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_provider text := event->'user'->'app_metadata'->>'provider';
  v_email text := lower(btrim(coalesce(event->'user'->>'email', '')));
  v_tenant text := public.microsoft_tenant_from_metadata(
    coalesce(event->'user'->'user_metadata', '{}'::jsonb)
  );
  v_expected_tenant text;
begin
  select lower(tenant_id::text)
  into v_expected_tenant
  from public.microsoft_access_config
  where singleton = true;

  if v_provider is distinct from 'azure' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Qbook access requires Microsoft sign-in.'
      )
    );
  end if;

  if v_expected_tenant is null or v_tenant is distinct from v_expected_tenant then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Microsoft tenant is not authorized for Qbook.'
      )
    );
  end if;

  if not exists (
    select 1
    from public.approved_users au
    where au.normalized_email = v_email
      and au.status = 'active'
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'This employee is not provisioned for Qbook.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

-- Serialize privileged access mutations so concurrent requests cannot remove the
-- final active Super Admin. This RPC is the only authenticated role/status update
-- path; linked profile synchronization is intentionally outside the transaction
-- because approved_users is the authorization authority.
create or replace function public.update_approved_user_access(
  p_approved_user_id uuid,
  p_role public.user_role,
  p_status public.user_status
)
returns public.approved_users
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_existing public.approved_users;
  v_updated public.approved_users;
begin
  if not public.is_super_admin() then
    raise exception 'Only an active Super Admin can change approved access.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('qbook-active-super-admin', 0));

  select *
  into v_existing
  from public.approved_users
  where id = p_approved_user_id
  for update;

  if not found then
    raise exception 'Approved user not found.' using errcode = 'P0002';
  end if;

  if v_existing.role::text = 'super_admin'
    and v_existing.status = 'active'
    and (p_role::text <> 'super_admin' or p_status <> 'active')
    and not exists (
      select 1
      from public.approved_users au
      where au.id <> v_existing.id
        and au.role::text = 'super_admin'
        and au.status = 'active'
    )
  then
    raise exception 'Cannot remove the final active Super Admin.'
      using errcode = '23514';
  end if;

  update public.approved_users
  set
    role = p_role,
    status = p_status,
    updated_by = auth.uid()
  where id = p_approved_user_id
  returning * into v_updated;

  return v_updated;
end;
$$;

revoke update, delete on table public.approved_users from authenticated;
drop policy if exists "Super admins can update approved users" on public.approved_users;
drop policy if exists "Super admins can delete approved users" on public.approved_users;
revoke execute on function public.update_approved_user_access(uuid, public.user_role, public.user_status)
  from public, anon;
grant execute on function public.update_approved_user_access(uuid, public.user_role, public.user_status)
  to authenticated;

-- Defense in depth after the auth hook: profile creation also rejects any
-- non-Microsoft, unlisted, or inactive identity and copies the allowlisted role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_approved public.approved_users;
begin
  if new.raw_app_meta_data->>'provider' is distinct from 'azure' then
    raise exception 'Qbook requires Microsoft authentication.';
  end if;

  select *
  into v_approved
  from public.approved_users
  where normalized_email = lower(btrim(new.email))
    and status = 'active';

  if not found then
    raise exception 'User is not actively pre-provisioned for Qbook.';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status
  )
  values (
    new.id,
    lower(btrim(new.email)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    v_approved.role,
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    role = v_approved.role,
    status = 'active',
    updated_at = now();

  return new;
end;
$$;

revoke execute on function public.microsoft_tenant_from_metadata(jsonb) from public, anon, authenticated;
revoke execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb) from public, anon, authenticated;

grant usage on schema public to supabase_auth_admin;
grant select on table public.approved_users to supabase_auth_admin;
grant select on table public.microsoft_access_config to supabase_auth_admin;
grant execute on function public.microsoft_tenant_from_metadata(jsonb) to supabase_auth_admin;
grant execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb) to supabase_auth_admin;

drop policy if exists "Supabase Auth can verify approved users" on public.approved_users;
create policy "Supabase Auth can verify approved users"
on public.approved_users
for select
to supabase_auth_admin
using (true);

drop policy if exists "Supabase Auth can verify Microsoft tenant" on public.microsoft_access_config;
create policy "Supabase Auth can verify Microsoft tenant"
on public.microsoft_access_config
for select
to supabase_auth_admin
using (true);

comment on function public.hook_enforce_preprovisioned_microsoft_access(jsonb) is
  'Configure as auth.hook.before_user_created. Fails closed unless provider=azure, tenant matches, and exact normalized email is active.';
