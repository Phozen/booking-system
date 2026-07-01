"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { checkBookingAvailability } from "@/lib/bookings/availability";
import { getFriendlyBookingError } from "@/lib/bookings/errors";
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
import { cateringValuesToDetails } from "@/lib/bookings/catering/validation";
import {
  formatCateringServingTime,
  formatCateringType,
} from "@/lib/bookings/catering/format";
import {
  getAppSettings,
  getEffectiveApprovalRequired,
} from "@/lib/settings/queries";
import { processEmailNotificationNow } from "@/lib/email/queue";
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
  catering_required: boolean;
  catering_type: string | null;
  catering_pax: number | null;
  catering_serving_time: string | null;
  catering_dietary_notes: string | null;
  catering_notes: string | null;
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
    const { data, error } = await supabase
      .from("email_notifications")
      .insert({
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
          attendeeCount: booking.attendee_count,
          startsAt: booking.starts_at,
          endsAt: booking.ends_at,
          status: booking.status,
        },
        related_booking_id: booking.id,
        idempotency_key: `booking-confirmation:${booking.id}:${recipientEmail}`,
      })
      .select("id")
      .maybeSingle();

    if (error && error.code !== "23505") {
      console.error("Booking confirmation notification insert failed", {
        bookingId: booking.id,
        message: error.message,
      });
    }

    if (data?.id) {
      const result = await processEmailNotificationNow(data.id, supabase);

      if (result.sent === 0) {
        console.error("Booking confirmation immediate send did not complete", {
          bookingId: booking.id,
          notificationId: data.id,
          result,
        });
      }
    }
  } catch (error) {
    console.error("Booking confirmation notification unavailable", error);
  }
}

async function insertCateringRequestNotifications({
  booking,
  requesterEmail,
  requesterName,
  facilityName,
}: {
  booking: CreatedBookingRecord;
  requesterEmail: string | undefined;
  requesterName: string | null | undefined;
  facilityName: string;
}) {
  if (!booking.catering_required) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("role", ["admin", "super_admin"])
      .eq("status", "active");

    if (adminsError) {
      console.error("Catering notification admin lookup failed", {
        bookingId: booking.id,
        message: adminsError.message,
      });
      return;
    }

    const recipients = ((admins as {
      id: string;
      email: string | null;
      full_name: string | null;
    }[] | null) ?? []).filter((admin) => admin.email);

    if (recipients.length === 0) {
      return;
    }

    const bookingWindow = formatEmailBookingWindow(
      booking.starts_at,
      booking.ends_at,
    );
    const { data, error } = await supabase
      .from("email_notifications")
      .insert(
        recipients.map((admin) => ({
          type: "booking_catering_request",
          status: "queued",
          recipient_email: admin.email,
          recipient_user_id: admin.id,
          subject: `Catering requested: ${booking.title}`,
          body: `${requesterName || requesterEmail || "A user"} requested ${formatCateringType(booking.catering_type)} for ${facilityName} on ${bookingWindow}.`,
          template_name: "booking_catering_request",
          template_data: {
            bookingId: booking.id,
            title: booking.title,
            facilityName,
            attendeeCount: booking.attendee_count,
            startsAt: booking.starts_at,
            endsAt: booking.ends_at,
            status: booking.status,
            requesterName,
            requesterEmail,
            cateringType: booking.catering_type,
            cateringPax: booking.catering_pax,
            cateringServingTime: booking.catering_serving_time,
            cateringServingTimeLabel: formatCateringServingTime(
              booking.catering_serving_time,
            ),
            cateringDietaryNotes: booking.catering_dietary_notes,
            cateringNotes: booking.catering_notes,
          },
          related_booking_id: booking.id,
          idempotency_key: `booking-catering-request:${booking.id}:${admin.email}`,
        })),
      )
      .select("id");

    if (error && error.code !== "23505") {
      console.error("Catering notification insert failed", {
        bookingId: booking.id,
        message: error.message,
      });
      return;
    }

    for (const notification of (data as { id: string }[] | null) ?? []) {
      const result = await processEmailNotificationNow(notification.id, supabase);

      if (result.sent === 0) {
        console.error("Catering notification immediate send did not complete", {
          bookingId: booking.id,
          notificationId: notification.id,
          result,
        });
      }
    }
  } catch (error) {
    console.error("Catering notification unavailable", error);
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
  const cateringDetails = cateringValuesToDetails(parsed.data);
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
    p_catering_required: cateringDetails.required,
    p_catering_type: cateringDetails.type,
    p_catering_pax: cateringDetails.pax,
    p_catering_serving_time: cateringDetails.servingTime,
    p_catering_dietary_notes: cateringDetails.dietaryNotes,
    p_catering_notes: cateringDetails.notes,
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
  await insertCateringRequestNotifications({
    booking,
    requesterEmail: user.email,
    requesterName: profile?.full_name,
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

export async function updateBookingAction(
  bookingId: string,
  _previousState: BookingActionResult,
  formData: FormData,
): Promise<BookingActionResult> {
  void _previousState;
  const { user, profile } = await requireUser();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in to update a booking.",
    };
  }

  if (profile?.status !== "active") {
    return {
      status: "error",
      message: "Your account is not active for booking changes.",
    };
  }

  const parsed = bookingFormSchema.safeParse(formDataToBookingValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the booking details, then try again.",
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
      message: "This booking can no longer be edited.",
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

  let availability;

  try {
    availability = await checkBookingAvailability(supabase, {
      facilityId: parsed.data.facilityId,
      startsAt: dateRange.startsAt,
      endsAt: dateRange.endsAt,
      attendeeCount,
      excludeBookingId: bookingId,
    });
  } catch (error) {
    console.error("Booking update availability check failed", error);
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

  const updateValues = {
    facilityId: parsed.data.facilityId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    attendeeCount,
    startsAt: dateRange.startsAt.toISOString(),
    endsAt: dateRange.endsAt.toISOString(),
  };

  const { data, error } = await supabase.rpc("update_own_booking", {
    p_booking_id: bookingId,
    p_facility_id: updateValues.facilityId,
    p_title: updateValues.title,
    p_description: updateValues.description,
    p_attendee_count: updateValues.attendeeCount,
    p_starts_at: updateValues.startsAt,
    p_ends_at: updateValues.endsAt,
  });

  if (error || !data) {
    console.error("Booking update RPC failed", {
      bookingId,
      facilityId: parsed.data.facilityId,
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

  const updated = data as CreatedBookingRecord;
  const adminSupabase = createAdminClient();
  await createAuditLogSafely(
    adminSupabase,
    {
      action: "update",
      entityType: "booking",
      entityId: bookingId,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Updated booking ${updated.title}.`,
      oldValues: {
        facilityId: existing.facilityId,
        title: existing.title,
        description: existing.description,
        attendeeCount: existing.attendeeCount,
        startsAt: existing.startsAt,
        endsAt: existing.endsAt,
      },
      newValues: {
        facilityId: updated.facility_id,
        title: updated.title,
        description: updated.description,
        attendeeCount: updated.attendee_count,
        startsAt: updated.starts_at,
        endsAt: updated.ends_at,
      },
    },
    { bookingId },
  );

  if (updated.status === "confirmed") {
    await runMicrosoftCalendarSyncSafely({
      bookingId,
      action: "confirm",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/bookings/${bookingId}/edit`);
  revalidatePath("/calendar");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);

  return {
    status: "success",
    message:
      "Booking updated. Availability was checked again before saving your changes.",
    bookingId,
    bookingStatus: updated.status === "pending" ? "pending" : "confirmed",
  };
}

export async function cancelRecurringFutureBookingsAction(
  bookingId: string,
  _previousState: CancellationActionResult,
  _formData: FormData,
): Promise<CancellationActionResult> {
  void _previousState;
  void _formData;
  return cancelRecurringBookingsScope(bookingId, "future");
}

export async function cancelRecurringSeriesAction(
  bookingId: string,
  _previousState: CancellationActionResult,
  _formData: FormData,
): Promise<CancellationActionResult> {
  void _previousState;
  void _formData;
  return cancelRecurringBookingsScope(bookingId, "series");
}

async function cancelRecurringBookingsScope(
  bookingId: string,
  scope: "future" | "series",
): Promise<CancellationActionResult> {
  const { user, profile } = await requireUser();

  if (profile.status !== "active") {
    return {
      status: "error",
      message: "Your account is not active for booking changes.",
    };
  }

  const supabase = await createClient();
  const existing = await getMyBookingById(supabase, user.id, bookingId);

  if (!existing?.recurrenceSeriesId) {
    return {
      status: "error",
      message: "This booking is not part of an active recurring series.",
    };
  }

  let impactedQuery = supabase
    .from("bookings")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("recurrence_series_id", existing.recurrenceSeriesId)
    .in("status", ["pending", "confirmed"]);

  if (scope === "future") {
    impactedQuery = impactedQuery.gte("starts_at", existing.startsAt);
  }

  const { data: impactedRows, error: impactedError } = await impactedQuery;

  if (impactedError) {
    return {
      status: "error",
      message: "Recurring bookings could not be loaded.",
    };
  }

  const impacted = (impactedRows as { id: string; status: BookingStatus }[] | null) ?? [];

  if (impacted.length === 0) {
    return {
      status: "error",
      message: "No cancellable recurring bookings were found.",
    };
  }

  let updateQuery = supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
      cancellation_reason:
        scope === "future"
          ? "Recurring booking future occurrences cancelled by owner."
          : "Recurring booking series cancelled by owner.",
    })
    .eq("user_id", user.id)
    .eq("recurrence_series_id", existing.recurrenceSeriesId)
    .in("status", ["pending", "confirmed"]);

  if (scope === "future") {
    updateQuery = updateQuery.gte("starts_at", existing.startsAt);
  }

  const { error } = await updateQuery;

  if (error) {
    return {
      status: "error",
      message: "Recurring bookings could not be cancelled.",
    };
  }

  if (scope === "series") {
    await supabase
      .from("booking_recurrence_series")
      .update({
        status: "cancelled",
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", existing.recurrenceSeriesId)
      .eq("owner_user_id", user.id);
  }

  await createAuditLogSafely(
    createAdminClient(),
    {
      action: "cancel",
      entityType: "booking",
      entityId: existing.recurrenceSeriesId,
      actorUserId: user.id,
      actorEmail: user.email,
      summary:
        scope === "future"
          ? "Cancelled future recurring booking occurrences."
          : "Cancelled recurring booking series.",
      oldValues: {
        seriesId: existing.recurrenceSeriesId,
        scope,
      },
      newValues: {
        cancelledBookingIds: impacted.map((item) => item.id),
      },
    },
    { bookingId },
  );

  for (const item of impacted) {
    if (item.status === "confirmed") {
      await runMicrosoftCalendarSyncSafely({
        bookingId: item.id,
        action: "cancel",
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-bookings");
  revalidatePath("/calendar");
  revalidatePath(`/bookings/${bookingId}`);

  return {
    status: "success",
    message:
      scope === "future"
        ? `Cancelled ${impacted.length} future recurring occurrence${impacted.length === 1 ? "" : "s"}.`
        : `Cancelled ${impacted.length} recurring occurrence${impacted.length === 1 ? "" : "s"}.`,
  };
}
