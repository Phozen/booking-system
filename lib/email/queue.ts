import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendNotificationEmail } from "@/lib/email/send";
import type {
  EmailNotificationStatus,
  EmailNotificationType,
  EmailTemplateData,
} from "@/lib/email/types";

type RelatedBookingRecord =
  | {
      id: string;
      title: string;
      status: string;
      starts_at: string;
      ends_at: string;
      facilities:
        | {
            name: string;
            level: string;
          }
        | {
            name: string;
            level: string;
          }[]
        | null;
    }
  | {
      id: string;
      title: string;
      status: string;
      starts_at: string;
      ends_at: string;
      facilities:
        | {
            name: string;
            level: string;
          }
        | {
            name: string;
            level: string;
          }[]
        | null;
    }[]
  | null;

type QueueNotificationRecord = {
  id: string;
  type: EmailNotificationType;
  status: EmailNotificationStatus;
  recipient_email: string;
  recipient_user_id: string | null;
  subject: string;
  body: string | null;
  template_name: string | null;
  template_data: EmailTemplateData | null;
  related_booking_id: string | null;
  provider: string | null;
  provider_message_id: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
  bookings?: RelatedBookingRecord;
};

export type EmailQueueProcessResult = {
  processed: number;
  sent: number;
  failed: number;
  retried: number;
  skipped: number;
  message: string;
};

const queueNotificationSelect = `
  id,
  type,
  status,
  recipient_email,
  recipient_user_id,
  subject,
  body,
  template_name,
  template_data,
  related_booking_id,
  provider,
  provider_message_id,
  attempts,
  max_attempts,
  last_error,
  scheduled_for,
  sent_at,
  created_at,
  bookings:related_booking_id (
    id,
    title,
    status,
    starts_at,
    ends_at,
    facilities (
      name,
      level
    )
  )
`;

function getRelatedBooking(record: QueueNotificationRecord) {
  return Array.isArray(record.bookings) ? record.bookings[0] : record.bookings;
}

function getRelatedFacility(record: QueueNotificationRecord) {
  const booking = getRelatedBooking(record);
  return Array.isArray(booking?.facilities)
    ? booking.facilities[0]
    : booking?.facilities;
}

function enrichTemplateData(record: QueueNotificationRecord): EmailTemplateData {
  const booking = getRelatedBooking(record);
  const facility = getRelatedFacility(record);

  return {
    ...(record.template_data ?? {}),
    bookingId:
      record.template_data?.bookingId ?? record.related_booking_id ?? booking?.id,
    title: record.template_data?.title ?? booking?.title,
    facilityName: record.template_data?.facilityName ?? facility?.name,
    facilityLevel: record.template_data?.facilityLevel ?? facility?.level,
    startsAt: record.template_data?.startsAt ?? booking?.starts_at,
    endsAt: record.template_data?.endsAt ?? booking?.ends_at,
    status: record.template_data?.status ?? booking?.status,
  };
}

async function claimNotification(
  supabase: SupabaseClient,
  record: QueueNotificationRecord,
) {
  const { data, error } = await supabase
    .from("email_notifications")
    .update({
      status: "sending",
      attempts: record.attempts + 1,
      last_error: null,
    })
    .eq("id", record.id)
    .eq("status", "queued")
    .select(queueNotificationSelect)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as QueueNotificationRecord;
}

async function markNotificationSent(
  supabase: SupabaseClient,
  notificationId: string,
  provider: string,
  messageId: string | null,
) {
  await supabase
    .from("email_notifications")
    .update({
      status: "sent",
      provider,
      provider_message_id: messageId,
      last_error: null,
      sent_at: new Date().toISOString(),
    })
    .eq("id", notificationId);
}

async function markNotificationFailed(
  supabase: SupabaseClient,
  record: QueueNotificationRecord,
  provider: string,
  error: string,
) {
  const shouldFailPermanently = record.attempts >= record.max_attempts;

  await supabase
    .from("email_notifications")
    .update({
      status: shouldFailPermanently ? "failed" : "queued",
      provider,
      last_error: error,
      scheduled_for: new Date().toISOString(),
    })
    .eq("id", record.id);
}

export async function processQueuedEmailNotifications(
  supabase: SupabaseClient,
  limit = 20,
): Promise<EmailQueueProcessResult> {
  const { data, error } = await supabase
    .from("email_notifications")
    .select(queueNotificationSelect)
    .eq("status", "queued")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      retried: 0,
      skipped: 0,
      message: "Queued emails could not be loaded.",
    };
  }

  const notifications =
    (data as unknown as QueueNotificationRecord[] | null) ?? [];
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of notifications) {
    if (notification.attempts >= notification.max_attempts) {
      await supabase
        .from("email_notifications")
        .update({
          status: "failed",
          last_error: "Maximum email send attempts reached.",
        })
        .eq("id", notification.id);
      failed += 1;
      continue;
    }

    const claimed = await claimNotification(supabase, notification);

    if (!claimed) {
      skipped += 1;
      continue;
    }

    processed += 1;
    const result = await sendNotificationEmail({
      type: claimed.type,
      recipientEmail: claimed.recipient_email,
      subject: claimed.subject,
      body: claimed.body,
      templateData: enrichTemplateData(claimed),
    });

    if (result.ok) {
      await markNotificationSent(
        supabase,
        claimed.id,
        result.provider,
        result.messageId,
      );
      sent += 1;
    } else {
      await markNotificationFailed(
        supabase,
        claimed,
        result.provider,
        result.error,
      );
      failed += claimed.attempts >= claimed.max_attempts ? 1 : 0;
    }
  }

  return {
    processed,
    sent,
    failed,
    retried: 0,
    skipped,
    message:
      notifications.length === 0
        ? "No queued emails were ready to process."
        : `Processed ${processed} queued email${processed === 1 ? "" : "s"}.`,
  };
}

export async function retryFailedEmailNotifications(
  supabase: SupabaseClient,
): Promise<EmailQueueProcessResult> {
  const { data, error } = await supabase
    .from("email_notifications")
    .update({
      status: "queued",
      attempts: 0,
      last_error: null,
      provider_message_id: null,
      sent_at: null,
      scheduled_for: new Date().toISOString(),
    })
    .eq("status", "failed")
    .select("id");

  if (error) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      retried: 0,
      skipped: 0,
      message: "Failed notifications could not be queued for retry.",
    };
  }

  const retried = data?.length ?? 0;

  return {
    processed: 0,
    sent: 0,
    failed: 0,
    retried,
    skipped: 0,
    message:
      retried === 0
        ? "No failed emails were available to retry."
        : `Queued ${retried} failed email${retried === 1 ? "" : "s"} for retry.`,
  };
}
