import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { appConfig } from "@/config/app";
import {
  baseDefaultAppSettings,
  mapSettingsRowsToAppSettings as mapRowsToSettings,
  normalizeDomain,
  type AppSettings,
  type SystemSettingRow,
} from "@/lib/settings/app-settings";
import { APP_SETTINGS_CACHE_TAG } from "@/lib/settings/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type { AppSettings } from "@/lib/settings/app-settings";
export {
  appSettingsToRows,
  formatAccountInactiveMessage,
  formatAllowedEmailDomains,
  formatContactAdministratorMessage,
  formatEffectiveApprovalCopy,
  formatEffectiveApprovalLabel,
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

async function queryAppSettings(client: SupabaseClient): Promise<AppSettings> {
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
}

async function loadCachedAppSettings() {
  try {
    return await queryAppSettings(createAdminClient());
  } catch (error) {
    console.error("System settings unavailable", error);
    return defaultAppSettings;
  }
}

const getCachedAppSettings = unstable_cache(
  loadCachedAppSettings,
  ["app-settings"],
  { revalidate: 300, tags: [APP_SETTINGS_CACHE_TAG] },
);

export const getAppSettings = cache(async function getAppSettings(
  supabase?: SupabaseClient,
) {
  if (supabase) {
    try {
      return await queryAppSettings(supabase);
    } catch (error) {
      console.error("System settings unavailable", error);
      return defaultAppSettings;
    }
  }

  return getCachedAppSettings();
});

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
