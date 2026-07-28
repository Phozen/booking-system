import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260727072458_restore_exact_preprovisioned_microsoft_access.sql",
  ),
  "utf8",
).toLowerCase();

describe("restored exact pre-provisioned Microsoft access", () => {
  it("requires an exact active approved-user record for each protected request", () => {
    expect(migration).toContain("create or replace function public.has_active_approved_access");
    expect(migration).toMatch(
      /join public[.]approved_users au\s+on au[.]normalized_email = lower\(btrim\(u[.]email\)\)/,
    );
    expect(migration).toContain("and au.status = 'active'");
    expect(migration).not.toContain("is_allowed_microsoft_email_domain");
  });

  it("rejects new Microsoft users unless their exact email is already active", () => {
    expect(migration).toContain("this employee is not provisioned for qbook");
    expect(migration).toContain("user is not actively pre-provisioned for qbook");
    expect(migration).toContain("v_provider is distinct from 'azure'");
    expect(migration).toContain("v_tenant is distinct from v_expected_tenant");
  });

  it("keeps the internal auth hook and profile trigger unavailable to browser roles", () => {
    expect(migration).toContain(
      "revoke execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb)\n  from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb)\n  to supabase_auth_admin",
    );
    expect(migration).toContain(
      "revoke execute on function public.handle_new_user() from public, anon, authenticated",
    );
  });
});
