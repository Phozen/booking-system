"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import {
  processQueuedEmailNotifications,
  retryFailedEmailNotifications,
  type EmailQueueProcessResult,
} from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmailNotificationsActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

function toActionResult(
  result: EmailQueueProcessResult,
): EmailNotificationsActionResult {
  return {
    status: "success",
    message: `${result.message} Sent: ${result.sent}. Failed: ${result.failed}. Retried: ${result.retried}. Skipped: ${result.skipped}.`,
  };
}

async function insertEmailProcessingAuditLog({
  actorUserId,
  actorEmail,
  summary,
  metadata,
}: {
  actorUserId: string;
  actorEmail: string | undefined;
  summary: string;
  metadata: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  await createAuditLogSafely(supabase, {
    action: "update",
    entityType: "email_notification",
    actorUserId,
    actorEmail,
    summary,
    metadata,
  });
}

export async function processQueuedEmailNotificationsAction(): Promise<EmailNotificationsActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const supabase = createAdminClient();
  const result = await processQueuedEmailNotifications(supabase);

  await insertEmailProcessingAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    summary: "Processed queued email notifications.",
    metadata: result,
  });

  revalidatePath("/admin/email-notifications");

  return toActionResult(result);
}

export async function retryFailedEmailNotificationsAction(): Promise<EmailNotificationsActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const supabase = createAdminClient();
  const result = await retryFailedEmailNotifications(supabase);

  await insertEmailProcessingAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    summary: "Queued failed email notifications for retry.",
    metadata: result,
  });

  revalidatePath("/admin/email-notifications");

  return toActionResult(result);
}
