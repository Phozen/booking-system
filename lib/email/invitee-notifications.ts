import "server-only";

import { formatBookingDateTime } from "@/lib/bookings/format";
import { createAppNotification } from "@/lib/notifications/app-notifications";
import { getBookingDepartmentSnapshot } from "@/lib/departments/notifications";
import { processEmailNotificationNow } from "@/lib/email/queue";
import { createAdminClient } from "@/lib/supabase/admin";

type InviteeConfirmationBooking = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  attendee_count?: number | null;
  starts_at: string;
  ends_at: string;
  status: string;
};

type InviteeRecipient = {
  id: string;
  email: string;
  full_name: string | null;
};

const ACTIVE_INVITATION_STATUSES = ["pending", "accepted"] as const;

function formatEmailBookingWindow(startsAt: string, endsAt: string) {
  return `${formatBookingDateTime(startsAt)} to ${formatBookingDateTime(endsAt)}`;
}

async function loadConfirmedBooking(bookingId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,user_id,title,description,attendee_count,starts_at,ends_at,status,facilities(name)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error("Booking could not be loaded for invitee confirmation.");
  }

  return data as
    | (InviteeConfirmationBooking & {
        facilities: { name: string } | { name: string }[] | null;
      })
    | null;
}

function firstRecord<T>(record: T | T[] | null | undefined) {
  return Array.isArray(record) ? record[0] : record ?? null;
}

async function loadInviteeRecipients({
  bookingId,
  inviteeUserIds,
  ownerUserId,
}: {
  bookingId: string;
  inviteeUserIds?: string[];
  ownerUserId: string;
}) {
  const supabase = createAdminClient();
  let invitationQuery = supabase
    .from("booking_invitations")
    .select("invited_user_id")
    .eq("booking_id", bookingId)
    .in("status", [...ACTIVE_INVITATION_STATUSES]);

  if (inviteeUserIds && inviteeUserIds.length > 0) {
    invitationQuery = invitationQuery.in("invited_user_id", inviteeUserIds);
  }

  const { data: invitations, error: invitationError } = await invitationQuery;

  if (invitationError) {
    throw new Error("Invitees could not be loaded for confirmation email.");
  }

  const userIds = [
    ...new Set(
      ((invitations ?? []) as { invited_user_id: string }[])
        .map((row) => row.invited_user_id)
        .filter((userId) => userId !== ownerUserId),
    ),
  ];

  if (userIds.length === 0) {
    return [] as InviteeRecipient[];
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,status")
    .in("id", userIds)
    .eq("status", "active");

  if (profileError) {
    throw new Error("Invitee profiles could not be loaded for confirmation email.");
  }

  return ((profiles ?? []) as (InviteeRecipient & { status: string })[])
    .filter((profile) => Boolean(profile.email))
    .map((profile) => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
    }));
}

/**
 * Queue booking_confirmation emails to active invitees on a confirmed booking.
 * Pass inviteeUserIds to limit to newly added people; otherwise all pending/accepted invitees.
 */
export async function queueInviteeBookingConfirmations({
  bookingId,
  inviteeUserIds,
}: {
  bookingId: string;
  inviteeUserIds?: string[];
}) {
  try {
    const booking = await loadConfirmedBooking(bookingId);

    if (!booking || booking.status !== "confirmed") {
      return;
    }

    const recipients = await loadInviteeRecipients({
      bookingId,
      inviteeUserIds,
      ownerUserId: booking.user_id,
    });

    if (recipients.length === 0) {
      return;
    }

    const facility = firstRecord(booking.facilities);
    const facilityName = facility?.name ?? "the facility";
    const bookingWindow = formatEmailBookingWindow(
      booking.starts_at,
      booking.ends_at,
    );
    const departments = await getBookingDepartmentSnapshot(bookingId).catch(
      (error) => {
        console.error("Booking department snapshot unavailable", {
          bookingId,
          error,
        });
        return [];
      },
    );
    const supabase = createAdminClient();

    for (const recipient of recipients) {
      await createAppNotification({
        userId: recipient.id,
        type: "booking_confirmation",
        title: `Booking confirmed: ${booking.title}`,
        body: `You are invited to ${booking.title} at ${facilityName} on ${bookingWindow}.`,
        href: `/bookings/${booking.id}`,
        relatedBookingId: booking.id,
      });

      const { data, error } = await supabase
        .from("email_notifications")
        .insert({
          type: "booking_confirmation",
          status: "queued",
          recipient_email: recipient.email,
          recipient_user_id: recipient.id,
          subject: `Booking confirmed: ${booking.title}`,
          body: `You are invited to ${booking.title} at ${facilityName} on ${bookingWindow}.`,
          template_name: "booking_confirmation",
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
            recipientRole: "invitee",
          },
          related_booking_id: booking.id,
          idempotency_key: `booking-confirmation:${booking.id}:${recipient.email}`,
        })
        .select("id")
        .maybeSingle();

      if (error && error.code !== "23505") {
        console.error("Invitee booking confirmation insert failed", {
          bookingId,
          recipientUserId: recipient.id,
          message: error.message,
        });
        continue;
      }

      if (data?.id) {
        const result = await processEmailNotificationNow(data.id, supabase);

        if (result.sent === 0) {
          console.error(
            "Invitee booking confirmation immediate send did not complete",
            {
              bookingId,
              notificationId: data.id,
              result,
            },
          );
        }
      }
    }
  } catch (error) {
    console.error("Invitee booking confirmation unavailable", {
      bookingId,
      error,
    });
  }
}
