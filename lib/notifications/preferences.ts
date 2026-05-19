import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type UserNotificationPreferences = {
  bookingRemindersEnabled: boolean;
  invitationUpdatesEnabled: boolean;
};

const defaultPreferences: UserNotificationPreferences = {
  bookingRemindersEnabled: true,
  invitationUpdatesEnabled: true,
};

type PreferenceRecord = {
  booking_reminders_enabled: boolean | null;
  invitation_updates_enabled: boolean | null;
};

export async function getUserNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserNotificationPreferences> {
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("booking_reminders_enabled,invitation_updates_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return defaultPreferences;
  }

  const record = data as PreferenceRecord | null;

  if (!record) {
    return defaultPreferences;
  }

  return {
    bookingRemindersEnabled:
      record.booking_reminders_enabled ?? defaultPreferences.bookingRemindersEnabled,
    invitationUpdatesEnabled:
      record.invitation_updates_enabled ??
      defaultPreferences.invitationUpdatesEnabled,
  };
}
