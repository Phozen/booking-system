"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export type NotificationPreferencesActionResult = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updateNotificationPreferencesAction(
  _previousState: NotificationPreferencesActionResult,
  formData: FormData,
): Promise<NotificationPreferencesActionResult> {
  void _previousState;
  const { user, profile } = await requireUser();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in to update notification preferences.",
    };
  }

  if (profile?.status !== "active") {
    return {
      status: "error",
      message: "Your account is not active.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_notification_preferences").upsert({
    user_id: user.id,
    booking_reminders_enabled: formData.get("bookingRemindersEnabled") === "on",
    invitation_updates_enabled:
      formData.get("invitationUpdatesEnabled") === "on",
  });

  if (error) {
    console.error("Notification preferences update failed", {
      message: error.message,
    });

    return {
      status: "error",
      message: "Notification preferences could not be saved. Please try again.",
    };
  }

  revalidatePath("/notification-preferences");

  return {
    status: "success",
    message: "Notification preferences saved.",
  };
}
