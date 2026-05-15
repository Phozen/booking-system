"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { formatBookingDateTime } from "@/lib/bookings/format";
import type { ApprovalStatus, BookingStatus } from "@/lib/bookings/queries";
import {
  cancelMicrosoftCalendarEventForBooking,
  syncConfirmedBookingToMicrosoftCalendar,
} from "@/lib/integrations/microsoft-365-calendar/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminBookingActionSchema,
  formDataToAdminBookingActionValues,
} from "@/lib/admin/bookings/validation";

export type AdminBookingActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

type AdminBookingActionRecord = {
  id: string;
  facility_id: string;
  user_id: string;
  title: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  approval_required: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
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
  profiles:
    | {
        email: string;
        full_name: string | null;
      }
    | {
        email: string;
        full_name: string | null;
      }[]
    | null;
  booking_approvals?: {
    id: string;
    status: ApprovalStatus;
    remarks: string | null;
  }[] | null;
};

function getBookingOwner(record: AdminBookingActionRecord) {
  return Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
}

function getBookingFacility(record: AdminBookingActionRecord) {
  return Array.isArray(record.facilities)
    ? record.facilities[0]
    : record.facilities;
}

function formatEmailBookingWindow(startsAt: string, endsAt: string) {
  return `${formatBookingDateTime(startsAt)} to ${formatBookingDateTime(endsAt)}`;
}

async function getAdminActionBooking(bookingId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      facility_id,
      user_id,
      title,
      status,
      starts_at,
      ends_at,
      approval_required,
      cancellation_reason,
      cancelled_at,
      facilities (
        name,
        level
      ),
      profiles!bookings_user_id_fkey (
        email,
        full_name
      ),
      booking_approvals (
        id,
        status,
        remarks
      )
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as AdminBookingActionRecord;
}

async function insertAuditLog({
  action,
  booking,
  adminUserId,
  adminEmail,
  summary,
  oldValues,
  newValues,
}: {
  action: "cancel" | "approve" | "reject";
  booking: AdminBookingActionRecord;
  adminUserId: string;
  adminEmail: string | undefined;
  summary: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  await createAuditLogSafely(
    supabase,
    {
      action,
      entityType: "booking",
      entityId: booking.id,
      actorUserId: adminUserId,
      actorEmail: adminEmail,
      summary,
      oldValues,
      newValues,
    },
    { bookingId: booking.id },
  );
}

async function insertBookingEmail({
  type,
  booking,
  subject,
  body,
  templateName,
  templateData,
}: {
  type: "booking_approval" | "booking_rejection" | "booking_cancellation";
  booking: AdminBookingActionRecord;
  subject: string;
  body: string;
  templateName: string;
  templateData: Record<string, unknown>;
}) {
  const owner = getBookingOwner(booking);

  if (!owner?.email) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("email_notifications").insert({
    type,
    status: "queued",
    recipient_email: owner.email,
    recipient_user_id: booking.user_id,
    subject,
    body,
    template_name: templateName,
    template_data: templateData,
    related_booking_id: booking.id,
  });

  if (error) {
    console.error("Admin booking notification insert failed", {
      bookingId: booking.id,
      type,
      message: error.message,
    });
  }
}

function revalidateAdminBookingPaths(bookingId: string) {
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/approvals");
  revalidatePath("/my-bookings");
  revalidatePath("/dashboard");
}

async function runMicrosoftCalendarSyncSafely({
  bookingId,
  action,
  actorUserId,
  actorEmail,
}: {
  bookingId: string;
  action: "confirm" | "cancel";
  actorUserId: string;
  actorEmail: string | undefined;
}) {
  try {
    const actor = { userId: actorUserId, email: actorEmail };
    const result =
      action === "confirm"
        ? await syncConfirmedBookingToMicrosoftCalendar(bookingId, actor)
        : await cancelMicrosoftCalendarEventForBooking(bookingId, actor);

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

export async function adminCancelBookingAction(
  bookingId: string,
  _previousState: AdminBookingActionResult,
  formData: FormData,
): Promise<AdminBookingActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = adminBookingActionSchema.safeParse(
    formDataToAdminBookingActionValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Cancellation reason is too long.",
    };
  }

  const existing = await getAdminActionBooking(bookingId);

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

  const cancellationReason = parsed.data.remarks || null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cancellationReason,
    })
    .eq("id", bookingId)
    .in("status", ["pending", "confirmed"])
    .select(
      "id,facility_id,user_id,title,status,starts_at,ends_at,approval_required,cancellation_reason,cancelled_at,facilities(name,level),profiles!bookings_user_id_fkey(email,full_name)",
    )
    .maybeSingle();

  if (error || !data) {
    console.error("Admin booking cancellation failed", {
      bookingId,
      message: error?.message,
    });

    return {
      status: "error",
      message: "Booking could not be cancelled. Please refresh and try again.",
    };
  }

  const updated = data as unknown as AdminBookingActionRecord;
  const facility = getBookingFacility(updated);
  const bookingWindow = formatEmailBookingWindow(
    updated.starts_at,
    updated.ends_at,
  );

  await insertAuditLog({
    action: "cancel",
    booking: updated,
    adminUserId: user.id,
    adminEmail: user.email,
    summary: `Admin cancelled booking ${updated.title}.`,
    oldValues: {
      status: existing.status,
      cancellationReason: existing.cancellation_reason,
      cancelledAt: existing.cancelled_at,
    },
    newValues: {
      status: updated.status,
      cancellationReason: updated.cancellation_reason,
      cancelledAt: updated.cancelled_at,
    },
  });

  await insertBookingEmail({
    type: "booking_cancellation",
    booking: updated,
    subject: `Booking cancelled: ${updated.title}`,
    body: `Your booking for ${facility?.name ?? "the facility"} on ${bookingWindow} has been cancelled.`,
    templateName: "booking_cancellation",
    templateData: {
      bookingId: updated.id,
      title: updated.title,
      facilityName: facility?.name ?? null,
      facilityLevel: facility?.level ?? null,
      startsAt: updated.starts_at,
      endsAt: updated.ends_at,
      cancellationReason: updated.cancellation_reason,
      status: updated.status,
    },
  });
  if (existing.status === "confirmed") {
    await runMicrosoftCalendarSyncSafely({
      bookingId,
      action: "cancel",
      actorUserId: user.id,
      actorEmail: user.email,
    });
  }

  revalidateAdminBookingPaths(bookingId);

  return {
    status: "success",
    message:
      "Booking cancelled. The requester will see the updated status and a cancellation email has been queued if possible.",
  };
}

export async function approveBookingAction(
  bookingId: string,
  _previousState: AdminBookingActionResult,
  formData: FormData,
): Promise<AdminBookingActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = adminBookingActionSchema.safeParse(
    formDataToAdminBookingActionValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Remarks are too long.",
    };
  }

  const existing = await getAdminActionBooking(bookingId);

  if (!existing) {
    return {
      status: "error",
      message: "Booking could not be found.",
    };
  }

  if (existing.status !== "pending") {
    return {
      status: "error",
      message: "Only pending bookings can be approved.",
    };
  }

  const supabase = createAdminClient();
  const { data: conflicts, error: conflictError } = await supabase
    .from("bookings")
    .select("id")
    .eq("facility_id", existing.facility_id)
    .in("status", ["pending", "confirmed"])
    .neq("id", bookingId)
    .lt("starts_at", existing.ends_at)
    .gt("ends_at", existing.starts_at)
    .limit(1);

  if (conflictError) {
    console.error("Approval conflict lookup failed", {
      bookingId,
      message: conflictError.message,
    });

    return {
      status: "error",
      message: "Approval conflict check failed. Please try again.",
    };
  }

  if ((conflicts?.length ?? 0) > 0) {
    return {
      status: "error",
      message:
        "This booking now conflicts with another active booking. It cannot be approved.",
    };
  }

  const reviewedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select(
      "id,facility_id,user_id,title,status,starts_at,ends_at,approval_required,cancellation_reason,cancelled_at,facilities(name,level),profiles!bookings_user_id_fkey(email,full_name)",
    )
    .maybeSingle();

  if (error || !data) {
    console.error("Booking approval update failed", {
      bookingId,
      code: error?.code,
      message: error?.message,
    });

    return {
      status: "error",
      message:
        error?.code === "23P01"
          ? "This booking now conflicts with another active booking. It cannot be approved."
          : "Booking could not be approved. Please refresh and try again.",
    };
  }

  const updated = data as unknown as AdminBookingActionRecord;
  const pendingApproval = existing.booking_approvals?.find(
    (approval) => approval.status === "pending",
  );

  if (pendingApproval) {
    const { error: approvalError } = await supabase
      .from("booking_approvals")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: reviewedAt,
        remarks: parsed.data.remarks || null,
      })
      .eq("id", pendingApproval.id);

    if (approvalError) {
      console.error("Booking approval record update failed", {
        bookingId,
        message: approvalError.message,
      });
    }
  }

  const facility = getBookingFacility(updated);
  const bookingWindow = formatEmailBookingWindow(
    updated.starts_at,
    updated.ends_at,
  );

  await insertAuditLog({
    action: "approve",
    booking: updated,
    adminUserId: user.id,
    adminEmail: user.email,
    summary: `Approved booking ${updated.title}.`,
    oldValues: { status: existing.status },
    newValues: { status: updated.status, remarks: parsed.data.remarks || null },
  });

  await insertBookingEmail({
    type: "booking_approval",
    booking: updated,
    subject: `Booking approved: ${updated.title}`,
    body: `Your booking for ${facility?.name ?? "the facility"} on ${bookingWindow} has been approved.`,
    templateName: "booking_approval",
    templateData: {
      bookingId: updated.id,
      title: updated.title,
      facilityName: facility?.name ?? null,
      facilityLevel: facility?.level ?? null,
      startsAt: updated.starts_at,
      endsAt: updated.ends_at,
      remarks: parsed.data.remarks || null,
      status: updated.status,
    },
  });
  await runMicrosoftCalendarSyncSafely({
    bookingId,
    action: "confirm",
    actorUserId: user.id,
    actorEmail: user.email,
  });

  revalidateAdminBookingPaths(bookingId);

  return {
    status: "success",
    message:
      "Booking approved. The requester will see it as confirmed and an approval email has been queued if possible.",
  };
}

export async function rejectBookingAction(
  bookingId: string,
  _previousState: AdminBookingActionResult,
  formData: FormData,
): Promise<AdminBookingActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = adminBookingActionSchema.safeParse(
    formDataToAdminBookingActionValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Rejection remarks are too long.",
    };
  }

  const existing = await getAdminActionBooking(bookingId);

  if (!existing) {
    return {
      status: "error",
      message: "Booking could not be found.",
    };
  }

  if (existing.status !== "pending") {
    return {
      status: "error",
      message: "Only pending bookings can be rejected.",
    };
  }

  const supabase = createAdminClient();
  const reviewedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select(
      "id,facility_id,user_id,title,status,starts_at,ends_at,approval_required,cancellation_reason,cancelled_at,facilities(name,level),profiles!bookings_user_id_fkey(email,full_name)",
    )
    .maybeSingle();

  if (error || !data) {
    console.error("Booking rejection update failed", {
      bookingId,
      message: error?.message,
    });

    return {
      status: "error",
      message: "Booking could not be rejected. Please refresh and try again.",
    };
  }

  const updated = data as unknown as AdminBookingActionRecord;
  const pendingApproval = existing.booking_approvals?.find(
    (approval) => approval.status === "pending",
  );

  if (pendingApproval) {
    const { error: approvalError } = await supabase
      .from("booking_approvals")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: reviewedAt,
        remarks: parsed.data.remarks || null,
      })
      .eq("id", pendingApproval.id);

    if (approvalError) {
      console.error("Booking rejection approval record update failed", {
        bookingId,
        message: approvalError.message,
      });
    }
  }

  const facility = getBookingFacility(updated);
  const bookingWindow = formatEmailBookingWindow(
    updated.starts_at,
    updated.ends_at,
  );

  await insertAuditLog({
    action: "reject",
    booking: updated,
    adminUserId: user.id,
    adminEmail: user.email,
    summary: `Rejected booking ${updated.title}.`,
    oldValues: { status: existing.status },
    newValues: { status: updated.status, remarks: parsed.data.remarks || null },
  });

  await insertBookingEmail({
    type: "booking_rejection",
    booking: updated,
    subject: `Booking rejected: ${updated.title}`,
    body: `Your booking for ${facility?.name ?? "the facility"} on ${bookingWindow} has been rejected.`,
    templateName: "booking_rejection",
    templateData: {
      bookingId: updated.id,
      title: updated.title,
      facilityName: facility?.name ?? null,
      facilityLevel: facility?.level ?? null,
      startsAt: updated.starts_at,
      endsAt: updated.ends_at,
      remarks: parsed.data.remarks || null,
      status: updated.status,
    },
  });

  revalidateAdminBookingPaths(bookingId);

  return {
    status: "success",
    message:
      "Booking rejected. The requester will see the updated status and a rejection email has been queued if possible.",
  };
}
