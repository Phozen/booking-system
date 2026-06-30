import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function loadEnvFile() {
  const envPath = join(process.cwd(), ".env.local");
  let text = "";

  try {
    text = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    process.env[key] ??= value;
  }
}

function compactError(error: { code?: string; message?: string } | null) {
  return {
    code: error?.code ?? null,
    message: error?.message ?? null,
  };
}

const runIntegration = process.env.RUN_SUPABASE_MUTATION_TESTS === "true";
const describeSupabase = runIntegration ? describe.sequential : describe.skip;

describeSupabase("email queue claiming Supabase integration", () => {
  loadEnvFile();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const marker = `email_queue_${Date.now()}`;
  const emailIds: string[] = [];
  let safeToRun = false;
  let skipReason = "";

  let admin: SupabaseClient;

  beforeAll(async () => {
    if (!url || !serviceRole) {
      throw new Error("Supabase env is required when RUN_SUPABASE_MUTATION_TESTS=true.");
    }

    admin = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date().toISOString();
    const [{ count: dueCount, error: dueError }, { count: sendingCount, error: sendingError }] =
      await Promise.all([
        admin
          .from("email_notifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "queued")
          .lte("scheduled_for", now),
        admin
          .from("email_notifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "sending"),
      ]);

    if (dueError || sendingError) {
      throw new Error(
        `Unable to verify email queue safety: ${dueError?.message ?? sendingError?.message}`,
      );
    }

    if ((dueCount ?? 0) > 0 || (sendingCount ?? 0) > 0) {
      skipReason =
        "Email queue claiming integration tests skipped to avoid claiming pre-existing due queued or sending email_notifications rows.";
      return;
    }

    safeToRun = true;
  });

  afterAll(async () => {
    if (!admin || emailIds.length === 0) {
      return;
    }

    await admin.from("email_notifications").delete().in("id", emailIds);
  });

  async function insertEmail({
    subject,
    status = "queued",
    attempts = 0,
    maxAttempts = 3,
    scheduledFor = new Date(Date.now() - 60_000).toISOString(),
    sendingStartedAt = null,
    idempotencyKey,
  }: {
    subject: string;
    status?: "queued" | "sending" | "sent" | "failed" | "cancelled";
    attempts?: number;
    maxAttempts?: number;
    scheduledFor?: string;
    sendingStartedAt?: string | null;
    idempotencyKey?: string;
  }) {
    const { data, error } = await admin
      .from("email_notifications")
      .insert({
        type: "booking_confirmation",
        status,
        recipient_email: `${marker}@example.com`,
        subject,
        body: marker,
        template_name: "booking_confirmation",
        template_data: { marker },
        attempts,
        max_attempts: maxAttempts,
        scheduled_for: scheduledFor,
        sending_started_at: sendingStartedAt,
        idempotency_key: idempotencyKey ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Unable to insert email notification: ${error?.message}`);
    }

    emailIds.push(data.id);
    return data as { id: string };
  }

  async function getEmail(id: string) {
    const { data, error } = await admin
      .from("email_notifications")
      .select(
        "id,status,attempts,max_attempts,provider,provider_message_id,last_error,scheduled_for,sent_at,failed_at,sending_started_at",
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new Error(`Unable to load email notification: ${error?.message}`);
    }

    return data as {
      id: string;
      status: string;
      attempts: number;
      max_attempts: number;
      provider: string | null;
      provider_message_id: string | null;
      last_error: string | null;
      scheduled_for: string;
      sent_at: string | null;
      failed_at: string | null;
      sending_started_at: string | null;
    };
  }

  function skipIfUnsafe() {
    if (!safeToRun) {
      console.warn(skipReason);
      return true;
    }

    return false;
  }

  it("claims a due queued row", async () => {
    if (skipIfUnsafe()) return;

    const email = await insertEmail({ subject: `${marker} due claim` });

    const { data, error } = await admin.rpc("claim_email_notifications", {
      p_limit: 1,
      p_stale_after: "15 minutes",
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({
      id: email.id,
      subject: `${marker} due claim`,
      attempts: 1,
      max_attempts: 3,
    });

    const updated = await getEmail(email.id);
    expect(updated.status).toBe("sending");
    expect(updated.attempts).toBe(1);
    expect(updated.sending_started_at).not.toBeNull();
  });

  it("does not claim a future scheduled row", async () => {
    if (skipIfUnsafe()) return;

    const email = await insertEmail({
      subject: `${marker} future claim`,
      scheduledFor: new Date(Date.now() + 60 * 60_000).toISOString(),
    });

    const { data, error } = await admin.rpc("claim_email_notifications", {
      p_limit: 1,
      p_stale_after: "15 minutes",
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data).toEqual([]);
    expect((await getEmail(email.id)).status).toBe("queued");
  });

  it("does not claim a max-attempts exhausted row", async () => {
    if (skipIfUnsafe()) return;

    const email = await insertEmail({
      subject: `${marker} exhausted claim`,
      attempts: 3,
      maxAttempts: 3,
    });

    const { data, error } = await admin.rpc("claim_email_notifications", {
      p_limit: 1,
      p_stale_after: "15 minutes",
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data).toEqual([]);
    const updated = await getEmail(email.id);
    expect(updated.status).toBe("queued");
    expect(updated.attempts).toBe(3);
  });

  it("concurrent claims do not return the same row", async () => {
    if (skipIfUnsafe()) return;

    const email = await insertEmail({ subject: `${marker} concurrent claim` });

    const [first, second] = await Promise.all([
      admin.rpc("claim_email_notifications", {
        p_limit: 1,
        p_stale_after: "15 minutes",
      }),
      admin.rpc("claim_email_notifications", {
        p_limit: 1,
        p_stale_after: "15 minutes",
      }),
    ]);

    expect(compactError(first.error)).toEqual({ code: null, message: null });
    expect(compactError(second.error)).toEqual({ code: null, message: null });

    const claimedIds = [...(first.data ?? []), ...(second.data ?? [])].map(
      (row) => row.id,
    );
    expect(claimedIds.filter((id) => id === email.id)).toHaveLength(1);
  });

  it("marks a sending row as sent with provider metadata", async () => {
    if (skipIfUnsafe()) return;

    const email = await insertEmail({ subject: `${marker} mark sent` });
    await admin.rpc("claim_email_notifications", {
      p_limit: 1,
      p_stale_after: "15 minutes",
    });

    const { data, error } = await admin.rpc("mark_email_notification_sent", {
      p_email_id: email.id,
      p_provider: "smtp",
      p_provider_message_id: "smtp-message-1",
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data?.status).toBe("sent");
    const updated = await getEmail(email.id);
    expect(updated.status).toBe("sent");
    expect(updated.sent_at).not.toBeNull();
    expect(updated.provider).toBe("smtp");
    expect(updated.provider_message_id).toBe("smtp-message-1");
    expect(updated.sending_started_at).toBeNull();
  });

  it("marks a sending row failed with retry and schedules a future attempt", async () => {
    if (skipIfUnsafe()) return;

    const email = await insertEmail({ subject: `${marker} retry failed` });
    await admin.rpc("claim_email_notifications", {
      p_limit: 1,
      p_stale_after: "15 minutes",
    });
    const retryAt = new Date(Date.now() + 30 * 60_000).toISOString();

    const { data, error } = await admin.rpc("mark_email_notification_failed", {
      p_email_id: email.id,
      p_error: "temporary provider timeout",
      p_retry_at: retryAt,
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data?.status).toBe("queued");
    const updated = await getEmail(email.id);
    expect(updated.status).toBe("queued");
    expect(updated.scheduled_for).toBe(retryAt);
    expect(updated.last_error).toBe("temporary provider timeout");
    expect(updated.sending_started_at).toBeNull();
  });

  it("marks a sending row permanently failed when retry_at is null", async () => {
    if (skipIfUnsafe()) return;

    const email = await insertEmail({ subject: `${marker} permanent failed` });
    await admin.rpc("claim_email_notifications", {
      p_limit: 1,
      p_stale_after: "15 minutes",
    });

    const { data, error } = await admin.rpc("mark_email_notification_failed", {
      p_email_id: email.id,
      p_error: "permanent provider failure",
      p_retry_at: null,
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data?.status).toBe("failed");
    const updated = await getEmail(email.id);
    expect(updated.status).toBe("failed");
    expect(updated.failed_at).not.toBeNull();
    expect(updated.last_error).toBe("permanent provider failure");
    expect(updated.sending_started_at).toBeNull();
  });

  it("recovers stale sending rows before claiming", async () => {
    if (skipIfUnsafe()) return;

    const recoverable = await insertEmail({
      subject: `${marker} stale recoverable`,
      status: "sending",
      attempts: 1,
      maxAttempts: 3,
      sendingStartedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    });
    const exhausted = await insertEmail({
      subject: `${marker} stale exhausted`,
      status: "sending",
      attempts: 3,
      maxAttempts: 3,
      sendingStartedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    });

    const { error } = await admin.rpc("claim_email_notifications", {
      p_limit: 1,
      p_stale_after: "15 minutes",
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    const recovered = await getEmail(recoverable.id);
    const failed = await getEmail(exhausted.id);
    expect(recovered.status).toBe("sending");
    expect(recovered.attempts).toBe(2);
    expect(failed.status).toBe("failed");
    expect(failed.failed_at).not.toBeNull();
  });
});
