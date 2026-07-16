import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "0031_preprovisioned_microsoft_access.sql",
  ),
  "utf8",
).toLowerCase();

describe("pre-provisioned Microsoft access migration", () => {
  it("creates an allowlist that does not depend on an existing auth user", () => {
    const tableDefinition = migration.match(
      /create table if not exists public[.]approved_users[\s\S]*?\n\);/,
    )?.[0];

    expect(tableDefinition).toBeDefined();
    expect(tableDefinition).toContain("normalized_email");
    expect(tableDefinition).toContain("unique (normalized_email)");
    expect(tableDefinition).not.toContain("references auth.users");
  });

  it("fails closed for non-Microsoft, wrong-tenant, unlisted, and inactive signups", () => {
    expect(migration).toContain("v_provider is distinct from 'azure'");
    expect(migration).toContain(
      "v_expected_tenant is null or v_tenant is distinct from v_expected_tenant",
    );
    expect(migration).toMatch(
      /where au[.]normalized_email = v_email\s+and au[.]status = 'active'/,
    );
    expect(migration).toContain("this employee is not provisioned for qbook");
  });

  it("rechecks exact active allowlist membership for every database authorization helper", () => {
    expect(migration).toContain("create or replace function public.is_active_user()");
    expect(migration).toContain("create or replace function public.is_admin()");
    expect(migration).toContain("create or replace function public.is_super_admin()");
    expect(migration).toMatch(
      /join public[.]approved_users au\s+on au[.]normalized_email = lower\(btrim\(u[.]email\)\)/,
    );
    expect(migration).toContain("u.raw_app_meta_data->>'provider' = 'azure'");
    expect(migration).toContain("join auth.identities i");
    expect(migration).toContain("i.provider = 'azure'");
    expect(migration).toContain("join public.microsoft_access_config mac");
    expect(migration).toContain("i.identity_data->>'tid'");
    expect(migration).not.toContain("allowed_email_domains");
  });

  it("does not expose the auth hook or provisioning writes to public callers", () => {
    expect(migration).toContain(
      "revoke execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb) from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb) to supabase_auth_admin",
    );
    expect(migration).toContain("with check (public.is_super_admin())");
    expect(migration).not.toMatch(
      /grant (insert|update|delete)[^;]*approved_users[^;]*to anon/,
    );
  });

  it("serializes role changes and protects the final active Super Admin", () => {
    expect(migration).toContain("create or replace function public.update_approved_user_access(");
    expect(migration).toContain(
      "pg_advisory_xact_lock(hashtextextended('qbook-active-super-admin', 0))",
    );
    expect(migration).toContain("cannot remove the final active super admin");
    expect(migration).toContain(
      "revoke update, delete on table public.approved_users from authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.update_approved_user_access",
    );
  });
});
