import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0024_email_queue_claiming.sql"),
  "utf8",
);

function compactSql(value: string) {
  return value.replace(/\s+/g, " ").toLowerCase();
}

const sql = compactSql(migration);
const statements = migration
  .split(";")
  .map((statement) => compactSql(statement))
  .filter(Boolean);

describe("email queue claiming migration", () => {
  it("adds idempotency and queue processing metadata", () => {
    expect(sql).toContain("add column if not exists sending_started_at");
    expect(sql).toContain("add column if not exists failed_at");
    expect(sql).toContain("add column if not exists idempotency_key");
    expect(sql).not.toContain("next_attempt_at");
  });

  it("uses scheduled_for for due claiming with FOR UPDATE SKIP LOCKED", () => {
    expect(sql).toContain("create or replace function public.claim_email_notifications");
    expect(sql).toContain("en.scheduled_for <= now()");
    expect(sql).toContain("for update skip locked");
    expect(sql).toContain("status = 'sending'");
    expect(sql).toContain("attempts = en.attempts + 1");
  });

  it("recovers stale sending rows before claiming new work", () => {
    expect(sql).toContain("p_stale_after interval default interval '15 minutes'");
    expect(sql).toContain("en.sending_started_at <= now() - v_stale_after");
    expect(sql).toContain("and en.attempts >= en.max_attempts");
    expect(sql).toContain("and en.attempts < en.max_attempts");
  });

  it("sent and failed marker functions only operate on sending rows", () => {
    expect(sql).toContain("create or replace function public.mark_email_notification_sent");
    expect(sql).toContain("create or replace function public.mark_email_notification_failed");
    expect(sql).toContain("and status = 'sending'");
    expect(sql).toContain("where id = p_email_id and status = 'sending'");
  });

  it("keeps queue RPCs service-role only", () => {
    for (const functionName of [
      "claim_email_notifications",
      "mark_email_notification_sent",
      "mark_email_notification_failed",
    ]) {
      expect(
        statements.some(
          (statement) =>
            statement.includes(`grant execute on function public.${functionName}`) &&
            statement.includes("to service_role"),
        ),
      ).toBe(true);
      expect(
        statements.some(
          (statement) =>
            statement.includes(`grant execute on function public.${functionName}`) &&
            statement.includes("to authenticated"),
        ),
      ).toBe(false);
      expect(
        statements.some(
          (statement) =>
            statement.includes(`revoke all on function public.${functionName}`) &&
            statement.includes("anon") &&
            statement.includes("authenticated"),
        ),
      ).toBe(true);
    }
  });

  it("adds a partial unique idempotency index", () => {
    expect(sql).toContain(
      "create unique index if not exists email_notifications_idempotency_key_idx",
    );
    expect(sql).toContain("on public.email_notifications(idempotency_key)");
    expect(sql).toContain("where idempotency_key is not null");
  });
});
