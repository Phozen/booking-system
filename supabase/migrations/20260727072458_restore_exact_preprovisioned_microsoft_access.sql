-- Restore the approved controlled-access model. A prior domain-only migration
-- allowed any company-domain Microsoft identity to create a Qbook profile.
-- Qbook requires an exact active approved_users record instead. Existing
-- profiles are intentionally retained; an unapproved profile simply cannot
-- regain protected access until a Super Admin pre-provisions its email.

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

revoke execute on function public.has_active_approved_access(uuid) from public, anon;
grant execute on function public.has_active_approved_access(uuid) to authenticated;

revoke execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb)
  from public, anon, authenticated;
grant execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb)
  to supabase_auth_admin;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

comment on function public.has_active_approved_access(uuid) is
  'Fails closed unless the current identity is Azure, belongs to the configured tenant, and has an exact active approved_users record.';

comment on function public.hook_enforce_preprovisioned_microsoft_access(jsonb) is
  'Configure as auth.hook.before_user_created. Fails closed unless provider=azure, tenant matches, and exact normalized email is active.';
