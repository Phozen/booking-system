"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAuditLog } from "@/lib/audit/log";
import { APP_SETTINGS_CACHE_TAG } from "@/lib/settings/cache";
import {
  appSettingsToRows,
  getAppSettings,
  type AppSettings,
} from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formDataToSettingsValues,
  settingsFormSchema,
} from "@/lib/admin/settings/validation";
import { withFlashToast } from "@/lib/ui/flash-toasts";

export type SettingsActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function updateSystemSettingsAction(
  _previousState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const { user, profile } = await requireSuperAdmin();

  if (!user || profile?.status !== "active") {
    return {
      status: "error",
      message: "You must be signed in as an active super admin.",
    };
  }

  const parsed = settingsFormSchema.safeParse(formDataToSettingsValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the settings, then try again.",
    };
  }

  const supabase = createAdminClient();
  const oldSettings = await getAppSettings(supabase);
  const newSettings: AppSettings = {
    appName: parsed.data.appName,
    companyName: parsed.data.companyName,
    systemContactEmail: parsed.data.systemContactEmail,
    allowedEmailDomains: parsed.data.allowedEmailDomainsText,
    defaultApprovalRequired: parsed.data.defaultApprovalRequired,
    allowFacilityApprovalOverride: parsed.data.allowFacilityApprovalOverride,
    calendarVisibilityMode: parsed.data.calendarVisibilityMode,
    defaultTimezone: parsed.data.defaultTimezone,
    bookingWindowStart: parsed.data.bookingWindowStart,
    bookingWindowEnd: parsed.data.bookingWindowEnd,
    reminderOffsetsMinutes: parsed.data.reminderOffsetsMinutesText,
    emailRecipients: {
      bookingOwnerConfirmations: parsed.data.bookingOwnerConfirmations,
      companyBookingConfirmations: parsed.data.companyBookingConfirmations,
      cateringRequests: parsed.data.cateringRequests,
      pendingApprovals: parsed.data.pendingApprovals,
    },
  };
  const rows = appSettingsToRows(newSettings).map((row) => ({
    key: row.key,
    value: row.value,
    description: row.description,
    is_public: row.is_public,
    updated_by: user.id,
  }));

  const { error } = await supabase.from("system_settings").upsert(rows, {
    onConflict: "key",
  });

  if (error) {
    console.error("System settings update failed", {
      message: error.message,
    });

    return {
      status: "error",
      message: "System settings could not be saved. Please try again.",
    };
  }

  try {
    await createAuditLog(supabase, {
      action: "settings_change",
      entityType: "system_setting",
      actorUserId: user.id,
      actorEmail: user.email,
      summary: "Updated system settings.",
      oldValues: { ...oldSettings },
      newValues: { ...newSettings },
    });
  } catch (auditError) {
    console.error("System settings audit log insert failed", auditError);
  }

  revalidateTag(APP_SETTINGS_CACHE_TAG, "max");
  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/bookings/new");
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");

  redirect(withFlashToast("/admin/dashboard", "settings-saved"));
}
