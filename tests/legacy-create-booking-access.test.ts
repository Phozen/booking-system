import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationsDirectory = join(process.cwd(), "supabase/migrations");
const hardeningMigration = "20260727064553_revoke_legacy_create_booking_execution.sql";

function compactSql(value: string) {
  return value.replace(/\s+/g, " ").toLowerCase();
}

const hardeningSql = compactSql(
  readFileSync(join(migrationsDirectory, hardeningMigration), "utf8"),
);
const laterMigrationSql = readdirSync(migrationsDirectory)
  .filter((fileName) => fileName > hardeningMigration)
  .map((fileName) => readFileSync(join(migrationsDirectory, fileName), "utf8"))
  .map(compactSql)
  .join("\n");

describe("legacy create_booking RPC access", () => {
  it("removes every public API role from both legacy overloads", () => {
    expect(hardeningSql).toContain(
      "revoke all on function public.create_booking( uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean ) from public, anon, authenticated, service_role",
    );
    expect(hardeningSql).toContain(
      "revoke all on function public.create_booking( uuid, uuid, uuid, text, text, integer, timestamptz, timestamptz, boolean, boolean, text, integer, text, text, text ) from public, anon, authenticated, service_role",
    );
  });

  it("does not re-expose a legacy overload in a later migration", () => {
    expect(laterMigrationSql).not.toMatch(
      /grant execute on function public\.create_booking\s*\(/,
    );
  });
});
