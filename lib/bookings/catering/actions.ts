"use server";

import { revalidatePath } from "next/cache";

import { isAdminRole } from "@/lib/auth/profile";
import { requireUser } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import type { CateringActionResult } from "@/lib/bookings/catering/action-state";
import {
  cateringValuesToDetails,
  cateringFormSchema,
  formDataToCateringValues,
} from "@/lib/bookings/catering/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CateringBookingRecord = {
  id: string;
  user_id: string;
  title: string;
  status: string;
  catering_required: boolean | null;
  catering_type: string | null;
  catering_pax: number | null;
  catering_serving_time: string | null;
  catering_dietary_notes: string | null;
  catering_notes: string | null;
};

function cateringSnapshot(record: CateringBookingRecord) {
  return {
    cateringRequired: Boolean(record.catering_required),
    cateringType: record.catering_type,
    cateringPax: record.catering_pax,
    cateringServingTime: record.catering_serving_time,
    cateringDietaryNotes: record.catering_dietary_notes,
    cateringNotes: record.catering_notes,
  };
}

function revalidateBookingCateringPaths(bookingId: string) {
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/bookings/${bookingId}/print`);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/admin/bookings/${bookingId}/print`);
  revalidatePath("/my-bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/reports");
}

export async function updateBookingCateringAction(
  bookingId: string,
  _previousState: CateringActionResult,
  formData: FormData,
): Promise<CateringActionResult> {
  const { user, profile } = await requireUser();
  const parsed = cateringFormSchema.safeParse(formDataToCateringValues(formData));

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .find(Boolean);

    return {
      status: "error",
      message: firstError ?? "Check the catering details, then try again.",
    };
  }

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("bookings")
    .select(
      "id,user_id,title,status,catering_required,catering_type,catering_pax,catering_serving_time,catering_dietary_notes,catering_notes",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      status: "error",
      message: "Booking could not be found.",
    };
  }

  const booking = existing as CateringBookingRecord;
  const isAdmin = isAdminRole(profile.role);
  const isOwner = booking.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return {
      status: "error",
      message: "You do not have permission to edit catering details.",
    };
  }

  if (
    !isAdmin &&
    !["pending", "confirmed"].includes(booking.status)
  ) {
    return {
      status: "error",
      message:
        "Catering details can only be changed while your booking is pending or confirmed.",
    };
  }

  const details = cateringValuesToDetails(parsed.data);
  const mutationClient = await createClient();
  const { data: updated, error: updateError } = await mutationClient.rpc(
    "update_booking_catering",
    {
      p_booking_id: bookingId,
      p_catering_required: details.required,
      p_catering_type: details.required ? details.type : null,
      p_catering_pax: details.required ? details.pax : null,
      p_catering_serving_time: details.required ? details.servingTime : null,
      p_catering_dietary_notes: details.required ? details.dietaryNotes : null,
      p_catering_notes: details.required ? details.notes : null,
    },
  );

  if (updateError || !updated) {
    console.error("Booking catering update failed", {
      bookingId,
      message: updateError?.message,
    });

    return {
      status: "error",
      message: "Catering details could not be saved. Please try again.",
    };
  }

  await createAuditLogSafely(
    supabase,
    {
      action: "update",
      entityType: "booking",
      entityId: bookingId,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: "Booking catering details updated.",
      oldValues: cateringSnapshot(booking),
      newValues: cateringSnapshot(updated as CateringBookingRecord),
    },
    { bookingId },
  );

  revalidateBookingCateringPaths(bookingId);

  return {
    status: "success",
    message:
      isOwner && booking.status === "confirmed"
        ? "Catering details saved. Changes to catering details may need to be reviewed by Admin/Facilities."
        : "Catering details saved.",
  };
}
