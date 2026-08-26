-- Local development seed. Loaded by `supabase db reset` / `supabase start`
-- (see [db.seed] in config.toml). This file is LOCAL ONLY: it is never applied
-- to hosted environments (which use `supabase db push` of migrations).

-- 1) Restore production-parity privileges for the service_role.
-- Hosted Supabase grants service_role full access to the public schema, which
-- the app's server-only admin client (lib/supabase/admin.ts) relies on. The
-- local CLI stack creates migration tables under the `postgres` role whose
-- default privileges do NOT include service_role SELECT/DML, so we re-grant it
-- here to mirror hosted behaviour.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;

-- 2) Bootstrap a pre-provisioned Microsoft super admin for local sign-in.
-- QBook is Microsoft-OAuth only; real OAuth is not available locally, so we
-- provision the auth user + Azure identity directly. The tenant here must match
-- MICROSOFT_TENANT_ID in .env.local. Password sign-in against local GoTrue then
-- yields a real session (see AGENTS.md for how to mint cookies for testing).
do $$
declare
  v_tenant text := '11111111-1111-1111-1111-111111111111';
  v_uid uuid := '22222222-2222-2222-2222-222222222222';
  v_sub text := '33333333-3333-3333-3333-333333333333';
  v_email text := 'superadmin@qbook.test';
begin
  insert into public.microsoft_access_config (singleton, tenant_id)
  values (true, v_tenant::uuid)
  on conflict (singleton) do update set tenant_id = excluded.tenant_id;

  insert into public.approved_users (email, role, status)
  values (v_email, 'super_admin', 'active')
  on conflict (normalized_email) do update
    set role = excluded.role, status = excluded.status;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_uid, 'authenticated', 'authenticated', v_email,
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"azure","providers":["azure"]}'::jsonb,
    jsonb_build_object(
      'full_name', 'QBook Super Admin',
      'tid', v_tenant,
      'iss', 'https://login.microsoftonline.com/' || v_tenant || '/v2.0'
    ),
    now(), now(), '', '', '', ''
  )
  on conflict (id) do update
    set encrypted_password = excluded.encrypted_password,
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        email_confirmed_at = excluded.email_confirmed_at;

  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  values (
    v_sub, v_uid,
    jsonb_build_object(
      'sub', v_sub, 'email', v_email, 'email_verified', true,
      'tid', v_tenant,
      'iss', 'https://login.microsoftonline.com/' || v_tenant || '/v2.0'
    ),
    'azure', now(), now(), now()
  )
  on conflict (provider_id, provider) do update
    set identity_data = excluded.identity_data, updated_at = now();
end $$;

-- 3) Bootstrap a pre-provisioned Microsoft admin (HR / Administration) for local sign-in.
do $$
declare
  v_tenant text := '11111111-1111-1111-1111-111111111111';
  v_uid uuid := '44444444-4444-4444-4444-444444444444';
  v_sub text := '55555555-5555-5555-5555-555555555555';
  v_email text := 'admin@qbook.test';
begin
  insert into public.approved_users (email, role, status)
  values (v_email, 'admin', 'active')
  on conflict (normalized_email) do update
    set role = excluded.role, status = excluded.status;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_uid, 'authenticated', 'authenticated', v_email,
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"azure","providers":["azure"]}'::jsonb,
    jsonb_build_object(
      'full_name', 'QBook Admin',
      'tid', v_tenant,
      'iss', 'https://login.microsoftonline.com/' || v_tenant || '/v2.0'
    ),
    now(), now(), '', '', '', ''
  )
  on conflict (id) do update
    set encrypted_password = excluded.encrypted_password,
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        email_confirmed_at = excluded.email_confirmed_at;

  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  values (
    v_sub, v_uid,
    jsonb_build_object(
      'sub', v_sub, 'email', v_email, 'email_verified', true,
      'tid', v_tenant,
      'iss', 'https://login.microsoftonline.com/' || v_tenant || '/v2.0'
    ),
    'azure', now(), now(), now()
  )
  on conflict (provider_id, provider) do update
    set identity_data = excluded.identity_data, updated_at = now();
end $$;
