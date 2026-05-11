import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { appConfig } from "@/config/app";
import {
  baseDefaultAppSettings,
  mapSettingsRowsToAppSettings as mapRowsToSettings,
  normalizeDomain,
  type AppSettings,
  type SystemSettingRow,
} from "@/lib/settings/app-settings";
import { createAdminClient } from "@/lib/supabase/admin";

export type { AppSettings } from "@/lib/settings/app-settings";
export {
  appSettingsToRows,
  formatAccountInactiveMessage,
  formatAllowedEmailDomains,
  formatContactAdministratorMessage,
  formatEffectiveApprovalCopy,
  formatEffectiveApprovalLabel,
  formatRegistrationDisabledMessage,
  getCompanyDisplayName,
  getEffectiveApprovalRequired,
  getSystemContactEmail,
} from "@/lib/settings/app-settings";

export const defaultAppSettings: AppSettings = {
  ...baseDefaultAppSettings,
  appName: appConfig.name || baseDefaultAppSettings.appName,
  companyName: appConfig.companyName || baseDefaultAppSettings.companyName,
  systemContactEmail:
    appConfig.supportEmail || baseDefaultAppSettings.systemContactEmail,
  defaultTimezone: appConfig.timezone || baseDefaultAppSettings.defaultTimezone,
};

export function mapSettingsRowsToAppSettings(
  rows: SystemSettingRow[],
): AppSettings {
  return mapRowsToSettings(rows, defaultAppSettings);
}

export async function getAppSettings(supabase?: SupabaseClient) {
  try {
    const client = supabase ?? createAdminClient();
    const { data, error } = await client
      .from("system_settings")
      .select("key,value");

    if (error) {
      console.error("System settings lookup failed", { message: error.message });
      return defaultAppSettings;
    }

    return mapSettingsRowsToAppSettings(
      (data as SystemSettingRow[] | null) ?? [],
    );
  } catch (error) {
    console.error("System settings unavailable", error);
    return defaultAppSettings;
  }
}

export async function getDefaultApprovalRequired() {
  const settings = await getAppSettings();
  return settings.defaultApprovalRequired;
}

export async function getBookingApprovalRequired(
  facilityRequiresApproval: boolean | null,
) {
  const settings = await getAppSettings();

  if (
    settings.allowFacilityApprovalOverride &&
    facilityRequiresApproval !== null
  ) {
    return facilityRequiresApproval;
  }

  return settings.defaultApprovalRequired;
}

export async function getRegistrationSettings() {
  const settings = await getAppSettings();
  return {
    registrationEnabled: settings.registrationEnabled,
    allowedEmailDomains: settings.allowedEmailDomains,
    systemContactEmail: settings.systemContactEmail,
  };
}

export function isEmailAllowedByDomain(email: string, allowedDomains: string[]) {
  if (allowedDomains.length === 0) {
    return true;
  }

  const domain = email.split("@").at(1)?.toLowerCase();

  if (!domain) {
    return false;
  }

  return allowedDomains.some((allowedDomain) => {
    const normalized = normalizeDomain(allowedDomain);
    return domain === normalized || domain.endsWith(`.${normalized}`);
  });
}
