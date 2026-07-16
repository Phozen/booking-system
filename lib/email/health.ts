import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export type EmailQueueHealth = {
  checkedAt: string;
  overdueQueued: number;
  staleSending: number;
  failed: number;
  exhaustedQueued: number;
  oldestDueAt: string | null;
  healthy: boolean;
};

const overdueAfterMinutes = 10;
const staleSendingAfterMinutes = 15;

async function countQuery(query: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await query;
  return error ? null : (count ?? 0);
}

export async function getEmailQueueHealth(
  supabase: SupabaseClient = createAdminClient(),
  now = new Date(),
): Promise<EmailQueueHealth> {
  const overdueBefore = new Date(
    now.getTime() - overdueAfterMinutes * 60_000,
  ).toISOString();
  const staleBefore = new Date(
    now.getTime() - staleSendingAfterMinutes * 60_000,
  ).toISOString();

  const [overdueQueued, staleSending, failed, exhaustedRows, oldestDue] =
    await Promise.all([
      countQuery(
        supabase
          .from("email_notifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "queued")
          .lte("scheduled_for", overdueBefore),
      ),
      countQuery(
        supabase
          .from("email_notifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "sending")
          .lte("sending_started_at", staleBefore),
      ),
      countQuery(
        supabase
          .from("email_notifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed"),
      ),
      supabase
        .from("email_notifications")
        .select("attempts,max_attempts")
        .eq("status", "queued"),
      supabase
        .from("email_notifications")
        .select("scheduled_for")
        .eq("status", "queued")
        .lte("scheduled_for", now.toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  const exhaustedQueued = exhaustedRows.error
    ? null
    : (exhaustedRows.data ?? []).filter(
        (row) => row.attempts >= row.max_attempts,
      ).length;
  const unknown = [overdueQueued, staleSending, failed, exhaustedQueued].some(
    (value) => value === null,
  );
  const health = {
    checkedAt: now.toISOString(),
    overdueQueued: overdueQueued ?? -1,
    staleSending: staleSending ?? -1,
    failed: failed ?? -1,
    exhaustedQueued: exhaustedQueued ?? -1,
    oldestDueAt: oldestDue.error ? null : (oldestDue.data?.scheduled_for ?? null),
    healthy:
      !unknown &&
      overdueQueued === 0 &&
      staleSending === 0 &&
      failed === 0 &&
      exhaustedQueued === 0,
  } satisfies EmailQueueHealth;

  return health;
}
