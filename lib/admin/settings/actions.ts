"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAuditLog } from "@/lib/audit/log";
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
    registrationEnabled: parsed.data.registrationEnabled,
    allowedEmailDomains: parsed.data.allowedEmailDomainsText,
    defaultApprovalRequired: parsed.data.defaultApprovalRequired,
    allowFacilityApprovalOverride: parsed.data.allowFacilityApprovalOverride,
    calendarVisibilityMode: parsed.data.calendarVisibilityMode,
    defaultTimezone: parsed.data.defaultTimezone,
    reminderOffsetsMinutes: parsed.data.reminderOffsetsMinutesText,
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

  revalidatePath("/admin/settings");
  revalidatePath("/register");
  revalidatePath("/bookings/new");
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");

  return {
    status: "success",
    message:
      "System settings saved. New registrations and future bookings will use the updated settings.",
  };
}
