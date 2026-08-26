import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260826093000_company_domain_access_and_angelo_super_admin.sql",
  ),
  "utf8",
).toLowerCase();

describe("company Microsoft-domain access and Angelo Super Admin", () => {
  it("seeds qhazanahsabah.com.my and checks domain membership", () => {
    expect(migration).toContain('"qhazanahsabah.com.my"');
    expect(migration).toContain("'allowed_email_domains'");
    expect(migration).toContain("public.is_allowed_microsoft_email_domain");
    expect(migration).toContain("jsonb_array_elements_text");
  });

  it("defaults new profiles to employee when no elevated access record exists", () => {
    expect(migration).toContain(
      "coalesce(v_approved.role, 'employee'::public.user_role)",
    );
    expect(migration).toContain("this microsoft email domain is not authorized for qbook");
  });

  it("still blocks explicitly inactive approved users", () => {
    expect(migration).toContain("and au.status <> 'active'");
    expect(migration).toContain("this qbook account is not active");
  });

  it("promotes angelo.intern to super_admin", () => {
    expect(migration).toContain("angelo.intern@qhazanahsabah.com.my");
    expect(migration).toContain("role = 'super_admin'");
  });

  it("keeps auth hook and profile trigger unavailable to browser roles", () => {
    expect(migration).toContain(
      "revoke execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb)",
    );
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain(
      "grant execute on function public.hook_enforce_preprovisioned_microsoft_access(jsonb)",
    );
    expect(migration).toContain("to supabase_auth_admin");
  });
});
