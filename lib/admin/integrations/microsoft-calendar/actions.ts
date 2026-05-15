"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { retryMicrosoftCalendarSync } from "@/lib/integrations/microsoft-365-calendar/sync";

export type MicrosoftCalendarRetryActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function retryMicrosoftCalendarSyncAction(
  _previousState: MicrosoftCalendarRetryActionResult,
  formData: FormData,
): Promise<MicrosoftCalendarRetryActionResult> {
  const { user } = await requireSuperAdmin();
  const bookingId = String(formData.get("bookingId") ?? "");

  if (!bookingId) {
    return {
      status: "error",
      message: "Booking ID is missing.",
    };
  }

  const result = await retryMicrosoftCalendarSync(bookingId, {
    userId: user.id,
    email: user.email,
    reason: "manual_retry",
  });

  revalidatePath("/admin/integrations/microsoft-calendar");
  revalidatePath(`/admin/bookings/${bookingId}`);

  return {
    status: result.status === "failed" ? "error" : "success",
    message: result.message,
  };
}
