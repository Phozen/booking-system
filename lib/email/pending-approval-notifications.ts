import "server-only";

import { formatBookingDateTime } from "@/lib/bookings/format";
import { getBookingDepartmentSnapshot } from "@/lib/departments/notifications";
import { processEmailNotificationNow } from "@/lib/email/queue";
import { getActiveEmailRecipients } from "@/lib/email/recipients";
import { createAppNotification } from "@/lib/notifications/app-notifications";
import type { AppSettings } from "@/lib/settings/app-settings";
import { createAdminClient } from "@/lib/supabase/admin";

type PendingApprovalBooking = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  attendee_count?: number | null;
  starts_at: string;
  ends_at: string;
  status: string;
  teams_meeting?: boolean | null;
};

async function getDepartmentSnapshotSafely(bookingId: string) {
  return getBookingDepartmentSnapshot(bookingId).catch((error) => {
    console.error("Booking department snapshot unavailable", { bookingId, error });
    return [];
  });
}

async function insertPendingBookingOwnerNotification({
  booking,
  facilityName,
  requesterEmail,
  requesterName,
}: {
  booking: PendingApprovalBooking;
  facilityName: string;
  requesterEmail: string | undefined;
  requesterName: string | null | undefined;
}) {
  if (!requesterEmail) {
    return;
  }

  const bookingWindow = `${formatBookingDateTime(booking.starts_at)} to ${formatBookingDateTime(booking.ends_at)}`;
  const departments = await getDepartmentSnapshotSafely(booking.id);
  const supabase = createAdminClient();

  await createAppNotification({
    userId: booking.user_id,
    type: "booking_pending",
    title: `Booking submitted: ${booking.title}`,
    body: `Your booking for ${facilityName} on ${bookingWindow} was submitted and is waiting for approval.`,
    href: `/bookings/${booking.id}`,
    relatedBookingId: booking.id,
  });

  const { data, error } = await supabase
    .from("email_notifications")
    .insert({
      type: "booking_pending",
      status: "queued",
      recipient_email: requesterEmail,
      recipient_user_id: booking.user_id,
      subject: `Booking submitted: ${booking.title}`,
      body: `Your booking for ${facilityName} on ${bookingWindow} was submitted and is waiting for approval.`,
      template_name: "booking_pending",
      template_data: {
        bookingId: booking.id,
        title: booking.title,
        description: booking.description ?? null,
        facilityName,
        attendeeCount: booking.attendee_count ?? null,
        startsAt: booking.starts_at,
        endsAt: booking.ends_at,
        status: booking.status,
        departments,
        requesterName,
        requesterEmail,
        teamsMeeting: booking.teams_meeting ?? null,
      },
      related_booking_id: booking.id,
      idempotency_key: `booking-pending:${booking.id}:${requesterEmail}`,
    })
    .select("id")
    .maybeSingle();

  if (error && error.code !== "23505") {
    console.error("Pending booking owner notification insert failed", {
      bookingId: booking.id,
      message: error.message,
    });
    return;
  }

  if (data?.id) {
    const result = await processEmailNotificationNow(data.id, supabase);

    if (result.sent === 0) {
      console.error(
        "Pending booking owner notification immediate send did not complete",
        {
          bookingId: booking.id,
          notificationId: data.id,
          result,
        },
      );
    }
  }
}

export async function insertPendingApprovalRequestNotifications({
  booking,
  facilityName,
  requesterEmail,
  requesterName,
  settings,
}: {
  booking: PendingApprovalBooking;
  facilityName: string;
  requesterEmail: string | undefined;
  requesterName: string | null | undefined;
  settings: Pick<AppSettings, "emailRecipients">;
}) {
  if (booking.status !== "pending") {
    return;
  }

  try {
    await insertPendingBookingOwnerNotification({
      booking,
      facilityName,
      requesterEmail,
      requesterName,
    });

    const supabase = createAdminClient();
    const recipients = (
      await getActiveEmailRecipients(supabase, settings, "pendingApprovals")
    ).filter((recipient) => recipient.id !== booking.user_id);

    if (recipients.length === 0) {
      return;
    }

    const bookingWindow = `${formatBookingDateTime(booking.starts_at)} to ${formatBookingDateTime(booking.ends_at)}`;
    const departments = await getDepartmentSnapshotSafely(booking.id);
    const requesterLabel =
      requesterName?.trim() || requesterEmail?.trim() || "A user";

    const { data, error } = await supabase
      .from("email_notifications")
      .insert(
        recipients.map((recipient) => ({
          type: "booking_approval_request",
          status: "queued",
          recipient_email: recipient.email,
          recipient_user_id: recipient.id,
          subject: `Approval needed: ${booking.title}`,
          body: `${requesterLabel} submitted a booking for ${facilityName} on ${bookingWindow}. It is waiting for approval.`,
          template_name: "booking_approval_request",
          template_data: {
            bookingId: booking.id,
            title: booking.title,
            description: booking.description ?? null,
            facilityName,
            attendeeCount: booking.attendee_count ?? null,
            startsAt: booking.starts_at,
            endsAt: booking.ends_at,
            status: booking.status,
            departments,
            requesterName,
            requesterEmail,
            teamsMeeting: booking.teams_meeting ?? null,
          },
          related_booking_id: booking.id,
          idempotency_key: `booking-approval-request:${booking.id}:${recipient.email}`,
        })),
      )
      .select("id");

    if (error && error.code !== "23505") {
      console.error("Pending approval notification insert failed", {
        bookingId: booking.id,
        message: error.message,
      });
      return;
    }

    for (const notification of (data as { id: string }[] | null) ?? []) {
      const result = await processEmailNotificationNow(notification.id, supabase);

      if (result.sent === 0) {
        console.error(
          "Pending approval notification immediate send did not complete",
          {
            bookingId: booking.id,
            notificationId: notification.id,
            result,
          },
        );
      }
    }
  } catch (error) {
    console.error("Pending approval notification unavailable", error);
  }
}
