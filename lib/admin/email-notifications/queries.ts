import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  EmailNotificationStatus,
  EmailNotificationType,
  EmailTemplateData,
} from "@/lib/email/types";

type RelatedBookingRecord =
  | {
      id: string;
      title: string;
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

type EmailNotificationRecord = {
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
  updated_at: string;
  bookings?: RelatedBookingRecord;
};

export type AdminEmailNotification = {
  id: string;
  type: EmailNotificationType;
  status: EmailNotificationStatus;
  recipientEmail: string;
  recipientUserId: string | null;
  subject: string;
  body: string | null;
  templateName: string | null;
  templateData: EmailTemplateData;
  relatedBookingId: string | null;
  provider: string | null;
  providerMessageId: string | null;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  scheduledFor: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    facilityName: string | null;
    facilityLevel: string | null;
  } | null;
};

const emailNotificationSelect = `
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
  updated_at,
  bookings:related_booking_id (
    id,
    title,
    starts_at,
    ends_at,
    facilities (
      name,
      level
    )
  )
`;

function mapEmailNotification(
  record: EmailNotificationRecord,
): AdminEmailNotification {
  const booking = Array.isArray(record.bookings)
    ? record.bookings[0]
    : record.bookings;
  const facility = Array.isArray(booking?.facilities)
    ? booking.facilities[0]
    : booking?.facilities;

  return {
    id: record.id,
    type: record.type,
    status: record.status,
    recipientEmail: record.recipient_email,
    recipientUserId: record.recipient_user_id,
    subject: record.subject,
    body: record.body,
    templateName: record.template_name,
    templateData: record.template_data ?? {},
    relatedBookingId: record.related_booking_id,
    provider: record.provider,
    providerMessageId: record.provider_message_id,
    attempts: record.attempts,
    maxAttempts: record.max_attempts,
    lastError: record.last_error,
    scheduledFor: record.scheduled_for,
    sentAt: record.sent_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    booking: booking
      ? {
          id: booking.id,
          title: booking.title,
          startsAt: booking.starts_at,
          endsAt: booking.ends_at,
          facilityName: facility?.name ?? null,
          facilityLevel: facility?.level ?? null,
        }
      : null,
  };
}

export async function getAdminEmailNotifications(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("email_notifications")
    .select(emailNotificationSelect)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Unable to load email notifications.");
  }

  return ((data as unknown as EmailNotificationRecord[] | null) ?? []).map(
    mapEmailNotification,
  );
}
