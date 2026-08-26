-- Allow any @qhazanahsabah.com.my Microsoft user to sign in as employee by
-- default. approved_users remains the authority for elevated roles (admin /
-- super_admin) and for explicit suspension (status <> active).
-- Also promote angelo.intern@qhazanahsabah.com.my to super_admin.

insert into public.system_settings (key, value, description, is_public)
values (
  'allowed_email_domains',
  '["qhazanahsabah.com.my"]'::jsonb,
  'Microsoft email domains allowed to access Qbook. Empty denies all Microsoft sign-ins.',
  false
)
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  is_public = excluded.is_public,
  updated_at = now();

create or replace function public.is_allowed_microsoft_email_domain(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.system_settings ss
    cross join lateral jsonb_array_elements_text(
      case
        when jsonb_typeof(ss.value) = 'array' then ss.value
        else '[]'::jsonb
      end
    ) as configured_domain(domain)
    where ss.key = 'allowed_email_domains'
      and lower(split_part(btrim(coalesce(p_email, '')), '@', 2)) =
        lower(ltrim(btrim(configured_domain.domain), '@'))
  );
$$;

revoke execute on function public.is_allowed_microsoft_email_domain(text)
  from public, anon, authenticated;
grant execute on function public.is_allowed_microsoft_email_domain(text)
  to supabase_auth_admin;

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
    join public.microsoft_access_config mac
      on mac.singleton = true
    where u.id = p_user_id
      and p_user_id = auth.uid()
      and u.raw_app_meta_data->>'provider' = 'azure'
      and public.is_allowed_microsoft_email_domain(u.email)
      and not exists (
        select 1
        from public.approved_users au
        where au.normalized_email = lower(btrim(u.email))
          and au.status <> 'active'
      )
      and lower(mac.tenant_id::text) = lower(
        coalesce(
          nullif(btrim(i.identity_data->>'tid'), ''),
          substring(i.identity_data->>'iss' from '(?i)login[.]microsoftonline[.]com/([0-9a-f-]{36})'),
          substring(i.identity_data->>'iss' from '(?i)sts[.]windows[.]net/([0-9a-f-]{36})')
        )
      )
  );
$$;

comment on function public.has_active_approved_access(uuid) is
  'Allows company-domain Microsoft users on the configured tenant. Explicit non-active approved_users rows still block access. Elevated roles still come from approved_users.';

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

  if not public.is_allowed_microsoft_email_domain(v_email) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'This Microsoft email domain is not authorized for Qbook.'
      )
    );
  end if;

  if exists (
    select 1
    from public.approved_users au
    where au.normalized_email = v_email
      and au.status <> 'active'
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'This Qbook account is not active.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

comment on function public.hook_enforce_preprovisioned_microsoft_access(jsonb) is
  'Configure as auth.hook.before_user_created. Allows configured company Microsoft domains; blocks wrong tenant/provider and explicitly inactive approved_users rows.';

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

  if not public.is_allowed_microsoft_email_domain(new.email) then
    raise exception 'This Microsoft email domain is not authorized for Qbook.';
  end if;

  select *
  into v_approved
  from public.approved_users
  where normalized_email = lower(btrim(new.email));

  if found and v_approved.status <> 'active' then
    raise exception 'This Qbook account is not active.';
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
    coalesce(v_approved.role, 'employee'::public.user_role),
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    role = excluded.role,
    status = 'active',
    updated_at = now();

  return new;
end;
$$;

revoke execute on function public.has_active_approved_access(uuid) from public, anon;
grant execute on function public.has_active_approved_access(uuid) to authenticated;

revoke execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb)
  from public, anon, authenticated;
grant execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb)
  to supabase_auth_admin;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Promote Angelo to Super Admin (access record + linked profile if present).
insert into public.approved_users (email, role, status)
values (
  'angelo.intern@qhazanahsabah.com.my',
  'super_admin',
  'active'
)
on conflict (normalized_email) do update
set
  email = excluded.email,
  role = 'super_admin',
  status = 'active',
  updated_at = now();

update public.profiles
set
  role = 'super_admin',
  status = 'active',
  updated_at = now()
where lower(btrim(email)) = 'angelo.intern@qhazanahsabah.com.my';
