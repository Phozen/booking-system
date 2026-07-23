import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260723094500_disable_inactive_email_recipients.sql",
  ),
  "utf8",
).replace(/\s+/g, " ").toLowerCase();

describe("disabled-user email guard migration", () => {
  it("retires pending user access by converting it to disabled", () => {
    expect(migration).toContain("create type public.user_status_next as enum ('active', 'disabled')");
    expect(migration).toContain("update public.profiles set status = 'disabled' where status = 'pending'");
    expect(migration).toContain("update public.approved_users set status = 'disabled' where status = 'pending'");
  });

  it("cancels a claimed email before delivery for an inactive recipient", () => {
    expect(migration).toContain(
      "create or replace function public.cancel_email_notification_for_inactive_recipient",
    );
    expect(migration).toContain("status = 'cancelled'");
    expect(migration).toContain("recipient account is disabled");
    expect(migration).toContain("to service_role");
  });
});
