"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { formatBookingDateTime } from "@/lib/bookings/format";
import {
  processQueuedEmailNotifications,
  retryFailedEmailNotifications,
  type EmailQueueProcessResult,
} from "@/lib/email";
import { getAppSettings } from "@/lib/settings/queries";
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

export async function queueDueBookingRemindersAction(): Promise<EmailNotificationsActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const settings = await getAppSettings();
  const offsets = settings.reminderOffsetsMinutes;
  const maxOffset = Math.max(...offsets, 0);
  const now = new Date();
  const horizon = new Date(now.getTime() + maxOffset * 60_000);
  const supabase = createAdminClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id,title,user_id,starts_at,ends_at,profiles!bookings_user_id_fkey(email,full_name),facilities(name,level)",
    )
    .eq("status", "confirmed")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", horizon.toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    return {
      status: "error",
      message: "Confirmed bookings could not be loaded for reminders.",
    };
  }

  let queued = 0;
  let skipped = 0;

  for (const booking of (bookings ?? []) as unknown as {
    id: string;
    title: string;
    user_id: string;
    starts_at: string;
    ends_at: string;
    profiles: { email: string; full_name: string | null } | { email: string; full_name: string | null }[] | null;
    facilities: { name: string; level: string } | { name: string; level: string }[] | null;
  }[]) {
    const profile = Array.isArray(booking.profiles)
      ? booking.profiles[0]
      : booking.profiles;
    const facility = Array.isArray(booking.facilities)
      ? booking.facilities[0]
      : booking.facilities;

    if (!profile?.email) {
      skipped += 1;
      continue;
    }

    const { data: preferences } = await supabase
      .from("user_notification_preferences")
      .select("booking_reminders_enabled")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    if (preferences?.booking_reminders_enabled === false) {
      skipped += 1;
      continue;
    }

    const startsAt = new Date(booking.starts_at);

    for (const offset of offsets) {
      const dueAt = new Date(startsAt.getTime() - offset * 60_000);

      if (dueAt > now) {
        continue;
      }

      const { data: existing } = await supabase
        .from("email_notifications")
        .select("id")
        .eq("type", "booking_reminder")
        .eq("related_booking_id", booking.id)
        .contains("template_data", { reminderOffsetMinutes: offset })
        .limit(1);

      if ((existing?.length ?? 0) > 0) {
        skipped += 1;
        continue;
      }

      const { error: insertError } = await supabase
        .from("email_notifications")
        .insert({
          type: "booking_reminder",
          status: "queued",
          recipient_email: profile.email,
          recipient_user_id: booking.user_id,
          subject: `Booking reminder: ${booking.title}`,
          body: `Reminder: ${booking.title} is scheduled for ${formatBookingDateTime(booking.starts_at)}.`,
          template_name: "booking_reminder",
          template_data: {
            bookingId: booking.id,
            title: booking.title,
            facilityName: facility?.name ?? null,
            facilityLevel: facility?.level ?? null,
            startsAt: booking.starts_at,
            endsAt: booking.ends_at,
            reminderOffsetMinutes: offset,
          },
          related_booking_id: booking.id,
          scheduled_for: now.toISOString(),
        });

      if (insertError) {
        skipped += 1;
      } else {
        queued += 1;
      }
    }
  }

  await insertEmailProcessingAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    summary: "Queued due booking reminder notifications.",
    metadata: { queued, skipped },
  });

  revalidatePath("/admin/email-notifications");

  return {
    status: "success",
    message: `Queued ${queued} due reminder${queued === 1 ? "" : "s"}. Skipped ${skipped}.`,
  };
}
