import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260717073947_allow_qhazanah_microsoft_domain_access.sql",
  ),
  "utf8",
).toLowerCase();

const triggerPermissionsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260717074706_revoke_public_handle_new_user.sql",
  ),
  "utf8",
).toLowerCase();

describe("Qhazanah Microsoft-domain access migration", () => {
  it("seeds the requested domain and fails closed when no domain is configured", () => {
    expect(migration).toContain('"qhazanahsabah.com.my"');
    expect(migration).toContain("'allowed_email_domains'");
    expect(migration).toContain("jsonb_array_elements_text");
    expect(migration).not.toContain("empty means unrestricted");
  });

  it("keeps the Microsoft tenant boundary and blocks explicitly suspended users", () => {
    expect(migration).toContain("i.provider = 'azure'");
    expect(migration).toContain("join public.microsoft_access_config mac");
    expect(migration).toContain("public.is_allowed_microsoft_email_domain(u.email)");
    expect(migration).toContain("and au.status <> 'active'");
  });

  it("creates ordinary employee profiles without an individual access record", () => {
    expect(migration).toContain("coalesce(v_approved.role, 'employee'::public.user_role)");
    expect(migration).toContain("this microsoft email domain is not authorized for qbook");
  });

  it("does not expose the domain lookup to browser roles", () => {
    expect(migration).toContain(
      "revoke execute on function public.is_allowed_microsoft_email_domain(text)\n  from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.is_allowed_microsoft_email_domain(text)\n  to supabase_auth_admin",
    );
  });

  it("does not expose the internal profile trigger as an RPC", () => {
    expect(triggerPermissionsMigration).toContain(
      "revoke execute on function public.handle_new_user() from public, anon, authenticated",
    );
  });
});
