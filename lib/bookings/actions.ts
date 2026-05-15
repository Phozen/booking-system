"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { checkBookingAvailability } from "@/lib/bookings/availability";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { getMyBookingById, type BookingStatus } from "@/lib/bookings/queries";
import {
  cancelMicrosoftCalendarEventForBooking,
  syncConfirmedBookingToMicrosoftCalendar,
} from "@/lib/integrations/microsoft-365-calendar/sync";
import {
  bookingFormSchema,
  cancellationFormSchema,
  formDataToBookingValues,
  formDataToCancellationValues,
  getBookingDateRange,
  normalizeAttendeeCount,
} from "@/lib/bookings/validation";
import {
  getAppSettings,
  getEffectiveApprovalRequired,
} from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type BookingActionResult = {
  status: "idle" | "error" | "success";
  message: string;
  bookingId?: string;
  bookingStatus?: "pending" | "confirmed";
};

type CreatedBookingRecord = {
  id: string;
  facility_id: string;
  user_id: string;
  title: string;
  description: string | null;
  attendee_count: number | null;
  status: "pending" | "confirmed";
  starts_at: string;
  ends_at: string;
  approval_required: boolean;
};

type CancelledBookingRecord = {
  id: string;
  facilityId: string;
  userId: string;
  title: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  facilityName: string;
};

export type CancellationActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

function getFriendlyBookingError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  if (
    error.code === "23P01" ||
    message.includes("bookings_no_overlapping_active") ||
    message.includes("exclusion constraint")
  ) {
    return "This time slot is no longer available. Please choose another time.";
  }

  if (message.includes("blocked")) {
    return "This facility is unavailable during the selected time due to a blocked period.";
  }

  if (message.includes("maintenance")) {
    return "This facility is under maintenance during the selected time.";
  }

  if (message.includes("not available") || message.includes("not found")) {
    return "This facility is not available for booking.";
  }

  if (message.includes("attendee")) {
    return "Attendee count exceeds the facility capacity.";
  }

  if (message.includes("active")) {
    return "Your account is not active for booking.";
  }

  if (message.includes("start time")) {
    return "Start time must be before end time.";
  }

  return "Booking could not be created. Please check the details and try again.";
}

function formatEmailBookingWindow(startsAt: string, endsAt: string) {
  return `${formatBookingDateTime(startsAt)} to ${formatBookingDateTime(endsAt)}`;
}

async function insertBookingAuditLog({
  booking,
  actorEmail,
}: {
  booking: CreatedBookingRecord;
  actorEmail: string | undefined;
}) {
  try {
    const supabase = createAdminClient();
    await createAuditLogSafely(
      supabase,
      {
        action: "create",
        entityType: "booking",
        entityId: booking.id,
        actorUserId: booking.user_id,
        actorEmail,
        summary: `Created booking ${booking.title}.`,
        newValues: { ...booking },
      },
      { bookingId: booking.id },
    );
  } catch (error) {
    console.error("Booking audit log unavailable", error);
  }
}

async function insertBookingConfirmationNotification({
  booking,
  recipientEmail,
  facilityName,
}: {
  booking: CreatedBookingRecord;
  recipientEmail: string | undefined;
  facilityName: string;
}) {
  if (!recipientEmail || booking.status !== "confirmed") {
    return;
  }

  try {
    const supabase = createAdminClient();
    const bookingWindow = formatEmailBookingWindow(
      booking.starts_at,
      booking.ends_at,
    );
    const { error } = await supabase.from("email_notifications").insert({
      type: "booking_confirmation",
      status: "queued",
      recipient_email: recipientEmail,
      recipient_user_id: booking.user_id,
      subject: `Booking confirmed: ${booking.title}`,
      body: `Your booking for ${facilityName} is confirmed for ${bookingWindow}.`,
      template_name: "booking_confirmation",
      template_data: {
        bookingId: booking.id,
        title: booking.title,
        facilityName,
        startsAt: booking.starts_at,
        endsAt: booking.ends_at,
        status: booking.status,
      },
      related_booking_id: booking.id,
    });

    if (error) {
      console.error("Booking confirmation notification insert failed", {
        bookingId: booking.id,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Booking confirmation notification unavailable", error);
  }
}

async function insertBookingCancellationSideEffects({
  booking,
  actorEmail,
  recipientEmail,
  oldValues,
}: {
  booking: CancelledBookingRecord;
  actorEmail: string | undefined;
  recipientEmail: string | undefined;
  oldValues: Record<string, unknown>;
}) {
  try {
    const supabase = createAdminClient();
    await createAuditLogSafely(
      supabase,
      {
        action: "cancel",
        entityType: "booking",
        entityId: booking.id,
        actorUserId: booking.userId,
        actorEmail,
        summary: `Cancelled booking ${booking.title}.`,
        oldValues,
        newValues: { ...booking },
      },
      { bookingId: booking.id },
    );

    if (!recipientEmail) {
      return;
    }

    const bookingWindow = formatEmailBookingWindow(
      booking.startsAt,
      booking.endsAt,
    );
    const { error: notificationError } = await supabase
      .from("email_notifications")
      .insert({
        type: "booking_cancellation",
        status: "queued",
        recipient_email: recipientEmail,
        recipient_user_id: booking.userId,
        subject: `Booking cancelled: ${booking.title}`,
        body: `Your booking for ${booking.facilityName} on ${bookingWindow} has been cancelled.`,
        template_name: "booking_cancellation",
        template_data: {
          bookingId: booking.id,
          title: booking.title,
          facilityName: booking.facilityName,
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
          cancellationReason: booking.cancellationReason,
          status: booking.status,
        },
        related_booking_id: booking.id,
      });

    if (notificationError) {
      console.error("Booking cancellation notification insert failed", {
        bookingId: booking.id,
        message: notificationError.message,
      });
    }
  } catch (error) {
    console.error("Booking cancellation side effects unavailable", error);
  }
}

async function runMicrosoftCalendarSyncSafely({
  bookingId,
  action,
}: {
  bookingId: string;
  action: "confirm" | "cancel";
}) {
  try {
    const result =
      action === "confirm"
        ? await syncConfirmedBookingToMicrosoftCalendar(bookingId)
        : await cancelMicrosoftCalendarEventForBooking(bookingId);

    if (result.status === "failed") {
      console.error("Microsoft calendar sync side effect failed", {
        bookingId,
        action,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Microsoft calendar sync side effect unavailable", {
      bookingId,
      action,
      error,
    });
  }
}

export async function createBookingAction(
  _previousState: BookingActionResult,
  formData: FormData,
): Promise<BookingActionResult> {
  const { user, profile } = await requireUser();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in to create a booking.",
    };
  }

  if (profile?.status !== "active") {
    return {
      status: "error",
      message: "Your account is not active for booking.",
    };
  }

  const parsed = bookingFormSchema.safeParse(formDataToBookingValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the booking details, then try again.",
    };
  }

  const attendeeCount = normalizeAttendeeCount(parsed.data.attendeeCount);
  const settings = await getAppSettings();
  const dateRange = getBookingDateRange(parsed.data, settings.defaultTimezone);

  if (!dateRange.startsAt || !dateRange.endsAt || dateRange.message) {
    return {
      status: "error",
      message: dateRange.message ?? "Choose a valid booking date and time.",
    };
  }

  const supabase = await createClient();
  let availability;

  try {
    availability = await checkBookingAvailability(supabase, {
      facilityId: parsed.data.facilityId,
      startsAt: dateRange.startsAt,
      endsAt: dateRange.endsAt,
      attendeeCount,
    });
  } catch (error) {
    console.error("Booking availability check failed", error);
    return {
      status: "error",
      message: "Availability could not be checked. Please try again.",
    };
  }

  if (!availability.available) {
    return {
      status: "error",
      message: availability.message,
    };
  }

  const approvalRequired = getEffectiveApprovalRequired(
    availability.facility.requiresApproval,
    settings,
  );

  const { data, error } = await supabase.rpc("create_booking", {
    p_facility_id: parsed.data.facilityId,
    p_user_id: user.id,
    p_created_by: user.id,
    p_title: parsed.data.title,
    p_description: parsed.data.description || null,
    p_attendee_count: attendeeCount,
    p_starts_at: dateRange.startsAt.toISOString(),
    p_ends_at: dateRange.endsAt.toISOString(),
    p_approval_required: approvalRequired,
  });

  if (error || !data) {
    console.error("Booking create failed", {
      code: error?.code,
      message: error?.message,
    });

    return {
      status: "error",
      message: getFriendlyBookingError({
        code: error?.code,
        message: error?.message,
      }),
    };
  }

  const booking = data as CreatedBookingRecord;

  await insertBookingAuditLog({
    booking,
    actorEmail: user.email,
  });
  await insertBookingConfirmationNotification({
    booking,
    recipientEmail: user.email,
    facilityName: availability.facility.name,
  });
  if (booking.status === "confirmed") {
    await runMicrosoftCalendarSyncSafely({
      bookingId: booking.id,
      action: "confirm",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/facilities");
  revalidatePath(`/facilities/${availability.facility.slug}`);
  revalidatePath("/my-bookings");
  revalidatePath(`/bookings/${booking.id}`);
  revalidatePath("/calendar");

  redirect(`/bookings/${booking.id}?created=1&invite=1`);
}

export async function cancelBookingAction(
  bookingId: string,
  _previousState: CancellationActionResult,
  formData: FormData,
): Promise<CancellationActionResult> {
  const { user, profile } = await requireUser();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in to cancel a booking.",
    };
  }

  if (profile?.status !== "active") {
    return {
      status: "error",
      message: "Your account is not active for booking changes.",
    };
  }

  const parsed = cancellationFormSchema.safeParse(
    formDataToCancellationValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Cancellation reason is too long.",
    };
  }

  const supabase = await createClient();
  const existing = await getMyBookingById(supabase, user.id, bookingId);

  if (!existing) {
    return {
      status: "error",
      message: "Booking could not be found.",
    };
  }

  if (existing.status !== "pending" && existing.status !== "confirmed") {
    return {
      status: "error",
      message: "This booking can no longer be cancelled.",
    };
  }

  const cancellationReason = parsed.data.reason || null;
  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cancellationReason,
    })
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed"])
    .select(
      "id,facility_id,user_id,title,status,starts_at,ends_at,cancellation_reason,cancelled_at,facilities(name)",
    )
    .maybeSingle();

  if (error || !data) {
    console.error("Booking cancellation failed", {
      bookingId,
      code: error?.code,
      message: error?.message,
    });

    return {
      status: "error",
      message: "Booking could not be cancelled. Please refresh and try again.",
    };
  }

  const updated = data as unknown as {
    id: string;
    facility_id: string;
    user_id: string;
    title: string;
    status: BookingStatus;
    starts_at: string;
    ends_at: string;
    cancellation_reason: string | null;
    cancelled_at: string | null;
    facilities: { name: string } | { name: string }[] | null;
  };
  const facilityRecord = Array.isArray(updated.facilities)
    ? updated.facilities[0]
    : updated.facilities;

  await insertBookingCancellationSideEffects({
    booking: {
      id: updated.id,
      facilityId: updated.facility_id,
      userId: updated.user_id,
      title: updated.title,
      status: updated.status,
      startsAt: updated.starts_at,
      endsAt: updated.ends_at,
      cancellationReason: updated.cancellation_reason,
      cancelledAt: updated.cancelled_at,
      facilityName: facilityRecord?.name ?? "the facility",
    },
    actorEmail: user.email,
    recipientEmail: user.email,
    oldValues: {
      id: existing.id,
      status: existing.status,
      cancellationReason: existing.cancellationReason,
      cancelledAt: existing.cancelledAt,
    },
  });
  if (existing.status === "confirmed") {
    await runMicrosoftCalendarSyncSafely({
      bookingId,
      action: "cancel",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-bookings");
  revalidatePath(`/bookings/${bookingId}`);

  return {
    status: "success",
    message:
      "Booking cancelled. It will remain visible in your cancelled bookings for reference.",
  };
}
