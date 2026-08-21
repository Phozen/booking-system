import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendNotificationEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EmailNotificationType,
  EmailTemplateData,
} from "@/lib/email/types";

type RelatedProfile = {
  email: string;
  full_name: string | null;
};

type RelatedBookingRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  attendee_count: number | null;
  teams_meeting: boolean | null;
  catering_type: string | null;
  catering_pax: number | null;
  catering_serving_time: string | null;
  catering_dietary_notes: string | null;
  catering_notes: string | null;
  cancellation_reason: string | null;
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
  profiles: RelatedProfile | RelatedProfile[] | null;
  booking_departments:
    | {
        departments:
          | { name: string; email: string }
          | { name: string; email: string }[]
          | null;
      }[]
    | null;
  booking_invitations:
    | {
        status: string;
        invited_user: RelatedProfile | RelatedProfile[] | null;
      }[]
    | null;
};

type RelatedBookingRecord = RelatedBookingRow | RelatedBookingRow[] | null;

type SingleRelatedBooking = Exclude<RelatedBookingRecord, null | unknown[]>;

type QueueNotificationRecord = {
  id: string;
  type: EmailNotificationType;
  recipient_email: string;
  recipient_user_id?: string | null;
  recipient_name: string | null;
  subject: string;
  body: string | null;
  template_data: EmailTemplateData | null;
  related_booking_id: string | null;
  provider: string | null;
  attempts: number;
  max_attempts: number;
  bookings?: RelatedBookingRecord;
  calendarEventEligible?: boolean;
};

export type EmailQueueProcessResult = {
  processed: number;
  sent: number;
  failed: number;
  retried: number;
  skipped: number;
  message: string;
};

export type SingleEmailProcessResult = Pick<
  EmailQueueProcessResult,
  "processed" | "sent" | "failed" | "retried" | "skipped"
> & {
  message: string;
};

const relatedBookingSelect = `
  id,
  user_id,
  title,
  description,
  attendee_count,
  teams_meeting,
  catering_type,
  catering_pax,
  catering_serving_time,
  catering_dietary_notes,
  catering_notes,
  cancellation_reason,
  status,
  starts_at,
  ends_at,
  facilities (
    name,
    level
  ),
  profiles!bookings_user_id_fkey (
    email,
    full_name
  ),
  booking_departments (
    departments (
      name,
      email
    )
  ),
  booking_invitations (
    status,
    invited_user:profiles!booking_invitations_invited_user_id_fkey (
      email,
      full_name
    )
  )
`;

const defaultStaleAfter = "15 minutes";

function getRetryAt(attempts: number, maxAttempts: number) {
  if (attempts >= maxAttempts) {
    return null;
  }

  const retryDelaysMinutes: Record<number, number> = {
    1: 5,
    2: 30,
    3: 120,
  };
  const minutes = retryDelaysMinutes[attempts] ?? 120;

  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function sanitizeQueueError(error: string) {
  return error.replace(/[\u0000-\u001F\u007F]+/g, " ").slice(0, 2000).trim();
}

async function attachRelatedBookings(
  supabase: SupabaseClient,
  records: QueueNotificationRecord[],
) {
  const bookingIds = [
    ...new Set(
      records
        .map((record) => record.related_booking_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (bookingIds.length === 0) {
    return records;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(relatedBookingSelect)
    .in("id", bookingIds);

  if (error) {
    console.error("Email queue related booking lookup failed", {
      message: error.message,
    });
    return records;
  }

  const bookingRows = ((data as RelatedBookingRecord[] | null) ?? []).filter(
    (booking): booking is SingleRelatedBooking =>
      Boolean(booking && !Array.isArray(booking)),
  );
  const bookingsById = new Map(bookingRows.map((booking) => [booking.id, booking]));
  const recipientUserIds = [
    ...new Set(
      records
        .map((record) => record.recipient_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const invitationKeys = new Set<string>();

  if (recipientUserIds.length > 0) {
    const { data: invitations, error: invitationsError } = await supabase
      .from("booking_invitations")
      .select("booking_id, invited_user_id")
      .in("booking_id", bookingIds)
      .in("invited_user_id", recipientUserIds)
      .in("status", ["pending", "accepted"]);

    if (invitationsError) {
      console.error("Email queue invitation lookup failed", {
        message: invitationsError.message,
      });
    } else {
      for (const invitation of invitations ?? []) {
        invitationKeys.add(`${invitation.booking_id}:${invitation.invited_user_id}`);
      }
    }
  }

  return records.map((record) => {
    const booking = record.related_booking_id
      ? bookingsById.get(record.related_booking_id) ?? null
      : null;
    const isOwner = Boolean(booking && record.recipient_user_id === booking.user_id);
    const isEligibleInvitee = Boolean(
      record.related_booking_id &&
        record.recipient_user_id &&
        invitationKeys.has(`${record.related_booking_id}:${record.recipient_user_id}`),
    );

    return {
      ...record,
      bookings: booking,
      calendarEventEligible: isOwner || isEligibleInvitee,
    };
  });
}

function getRelatedBooking(record: QueueNotificationRecord) {
  return Array.isArray(record.bookings) ? record.bookings[0] : record.bookings;
}

function getRelatedFacility(record: QueueNotificationRecord) {
  const booking = getRelatedBooking(record);
  return Array.isArray(booking?.facilities)
    ? booking.facilities[0]
    : booking?.facilities;
}

function getRelatedDepartments(record: QueueNotificationRecord) {
  const booking = getRelatedBooking(record);

  return (booking?.booking_departments ?? []).flatMap((row) => {
    const department = row.departments;
    return Array.isArray(department)
      ? department
      : department
        ? [department]
        : [];
  });
}

function getRelatedOwner(record: QueueNotificationRecord) {
  const booking = getRelatedBooking(record);
  const owner = booking?.profiles;
  return Array.isArray(owner) ? owner[0] : owner;
}

function getRelatedInvitees(record: QueueNotificationRecord) {
  const booking = getRelatedBooking(record);

  return (booking?.booking_invitations ?? []).flatMap((invitation) => {
    if (!["pending", "accepted"].includes(invitation.status)) {
      return [];
    }

    const invitee = Array.isArray(invitation.invited_user)
      ? invitation.invited_user[0]
      : invitation.invited_user;

    if (!invitee?.email) {
      return [];
    }

    return [
      {
        name: invitee.full_name,
        email: invitee.email,
      },
    ];
  });
}

function enrichTemplateData(record: QueueNotificationRecord): EmailTemplateData {
  const booking = getRelatedBooking(record);
  const facility = getRelatedFacility(record);
  const owner = getRelatedOwner(record);
  const invitees = getRelatedInvitees(record);
  const queued = record.template_data ?? {};

  return {
    ...queued,
    bookingId: queued.bookingId ?? record.related_booking_id ?? booking?.id,
    title: queued.title ?? booking?.title,
    description: queued.description ?? booking?.description,
    facilityName: queued.facilityName ?? facility?.name,
    facilityLevel: queued.facilityLevel ?? facility?.level,
    startsAt: queued.startsAt ?? booking?.starts_at,
    endsAt: queued.endsAt ?? booking?.ends_at,
    status: queued.status ?? booking?.status,
    attendeeCount: queued.attendeeCount ?? booking?.attendee_count,
    teamsMeeting: queued.teamsMeeting ?? booking?.teams_meeting,
    requesterName: queued.requesterName ?? owner?.full_name,
    requesterEmail: queued.requesterEmail ?? owner?.email,
    cateringType: queued.cateringType ?? booking?.catering_type,
    cateringPax: queued.cateringPax ?? booking?.catering_pax,
    cateringServingTime: queued.cateringServingTime ?? booking?.catering_serving_time,
    cateringDietaryNotes: queued.cateringDietaryNotes ?? booking?.catering_dietary_notes,
    cateringNotes: queued.cateringNotes ?? booking?.catering_notes,
    cancellationReason: queued.cancellationReason ?? booking?.cancellation_reason,
    departments: queued.departments ?? getRelatedDepartments(record),
    invitees: queued.invitees ?? invitees,
    calendarEventPath:
      record.calendarEventEligible &&
      (queued.status ?? booking?.status) === "confirmed" &&
      (queued.bookingId ?? record.related_booking_id ?? booking?.id)
        ? `/bookings/${queued.bookingId ?? record.related_booking_id ?? booking?.id}/calendar`
        : undefined,
  };
}

async function markNotificationSent(
  supabase: SupabaseClient,
  notificationId: string,
  provider: string,
  messageId: string | null,
) {
  return supabase.rpc("mark_email_notification_sent", {
    p_email_id: notificationId,
    p_provider: provider,
    p_provider_message_id: messageId,
  });
}

async function markNotificationFailed(
  supabase: SupabaseClient,
  record: QueueNotificationRecord,
  error: string,
) {
  return supabase.rpc("mark_email_notification_failed", {
    p_email_id: record.id,
    p_error: sanitizeQueueError(error) || "Email delivery failed.",
    p_retry_at: getRetryAt(record.attempts, record.max_attempts),
  });
}

async function cancelForInactiveRecipient(
  supabase: SupabaseClient,
  notificationId: string,
) {
  const { data, error } = await supabase.rpc(
    "cancel_email_notification_for_inactive_recipient",
    { p_email_id: notificationId },
  );

  if (error) {
    console.error("Email recipient status check failed", {
      notificationId,
      message: error.message,
    });
    throw new Error("Email recipient status could not be verified.");
  }

  return data === true;
}

async function processClaimedNotification(
  supabase: SupabaseClient,
  claimed: QueueNotificationRecord,
) {
  if (await cancelForInactiveRecipient(supabase, claimed.id)) {
    return "skipped" as const;
  }

  const result = await sendNotificationEmail({
    type: claimed.type,
    recipientEmail: claimed.recipient_email,
    subject: claimed.subject,
    body: claimed.body,
    templateData: enrichTemplateData(claimed),
  });

  if (result.ok) {
    const { error: markSentError } = await markNotificationSent(
      supabase,
      claimed.id,
      result.provider,
      result.messageId,
    );

    if (markSentError) {
      console.error("Email queue sent marker failed", {
        notificationId: claimed.id,
        provider: result.provider,
        message: markSentError.message,
      });
      throw new Error("Email was sent but its delivery status could not be recorded.");
    }

    return "sent" as const;
  }

  const retryAt = getRetryAt(claimed.attempts, claimed.max_attempts);
  const { error: markFailedError } = await markNotificationFailed(
    supabase,
    claimed,
    result.error,
  );

  if (markFailedError) {
    console.error("Email queue failed marker failed", {
      notificationId: claimed.id,
      provider: result.provider,
      message: markFailedError.message,
    });
    throw new Error("Email failure status could not be recorded.");
  }

  return retryAt ? ("retried" as const) : ("failed" as const);
}

export async function processEmailNotificationNow(
  notificationId: string,
  supabase: SupabaseClient = createAdminClient(),
): Promise<SingleEmailProcessResult> {
  const { data, error } = await supabase
    .from("email_notifications")
    .update({
      status: "sending",
      attempts: 1,
      sending_started_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("status", "queued")
    .lt("attempts", 1)
    .select(
      "id,type,recipient_email,recipient_user_id,subject,body,template_data,related_booking_id,provider,attempts,max_attempts",
    )
    .maybeSingle();

  if (error) {
    console.error("Immediate email notification claim failed", {
      notificationId,
      message: error.message,
    });

    return {
      processed: 0,
      sent: 0,
      failed: 0,
      retried: 0,
      skipped: 1,
      message: "Email notification could not be claimed for immediate sending.",
    };
  }

  if (!data) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      retried: 0,
      skipped: 1,
      message: "Email notification was not queued for immediate sending.",
    };
  }

  const [claimed] = await attachRelatedBookings(supabase, [
    data as unknown as QueueNotificationRecord,
  ]);
  const outcome = await processClaimedNotification(supabase, claimed);

  return {
    processed: 1,
    sent: outcome === "sent" ? 1 : 0,
    failed: outcome === "failed" ? 1 : 0,
    retried: outcome === "retried" ? 1 : 0,
    skipped: outcome === "skipped" ? 1 : 0,
    message: "Processed booking confirmation email notification.",
  };
}

export async function processQueuedEmailNotifications(
  supabaseOrLimit?: SupabaseClient | number,
  limit = 20,
): Promise<EmailQueueProcessResult> {
  const supabase =
    typeof supabaseOrLimit === "number" || supabaseOrLimit == null
      ? createAdminClient()
      : supabaseOrLimit;
  const claimLimit =
    typeof supabaseOrLimit === "number" ? supabaseOrLimit : limit;
  const { data, error } = await supabase.rpc("claim_email_notifications", {
    p_limit: claimLimit,
    p_stale_after: defaultStaleAfter,
  });

  if (error) {
    console.error("Email queue claim failed", { message: error.message });
    throw new Error("Queued emails could not be claimed.");
  }

  const notifications = await attachRelatedBookings(
    supabase,
    (data as unknown as QueueNotificationRecord[] | null) ?? [],
  );
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let retried = 0;
  let skipped = 0;

  for (const claimed of notifications) {
    processed += 1;
    const outcome = await processClaimedNotification(supabase, claimed);

    if (outcome === "sent") {
      sent += 1;
    } else if (outcome === "failed") {
      failed += 1;
    } else if (outcome === "retried") {
      retried += 1;
    } else if (outcome === "skipped") {
      skipped += 1;
    }
  }

  return {
    processed,
    sent,
    failed,
    retried,
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
      failed_at: null,
      sending_started_at: null,
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
