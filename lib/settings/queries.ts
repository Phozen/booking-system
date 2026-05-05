import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export type AppSettings = {
  appName: string;
  companyName: string;
  systemContactEmail: string;
  registrationEnabled: boolean;
  allowedEmailDomains: string[];
  defaultApprovalRequired: boolean;
  allowFacilityApprovalOverride: boolean;
  defaultTimezone: string;
  reminderOffsetsMinutes: number[];
};

export const defaultAppSettings: AppSettings = {
  appName: "Booking System",
  companyName: "",
  systemContactEmail: "",
  registrationEnabled: true,
  allowedEmailDomains: [],
  defaultApprovalRequired: false,
  allowFacilityApprovalOverride: true,
  defaultTimezone: "Asia/Kuala_Lumpur",
  reminderOffsetsMinutes: [1440, 60],
};

const settingKeyMap = {
  appName: "app_name",
  companyName: "company_name",
  systemContactEmail: "system_contact_email",
  registrationEnabled: "registration_enabled",
  allowedEmailDomains: "allowed_email_domains",
  defaultApprovalRequired: "default_approval_required",
  allowFacilityApprovalOverride: "facility_approval_override_enabled",
  defaultTimezone: "default_timezone",
  reminderOffsetsMinutes: "reminder_offsets_minutes",
} as const;

type SystemSettingRow = {
  key: string;
  value: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPositiveIntegerArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((item) => Number.isInteger(item) && item > 0)
  );
}

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "");
}

export function mapSettingsRowsToAppSettings(
  rows: SystemSettingRow[],
): AppSettings {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const approvalOverride =
    values.get(settingKeyMap.allowFacilityApprovalOverride) ??
    values.get("allow_facility_approval_override");
  const allowedEmailDomains = values.get(settingKeyMap.allowedEmailDomains);
  const reminderOffsets = values.get(settingKeyMap.reminderOffsetsMinutes);

  return {
    appName:
      typeof values.get(settingKeyMap.appName) === "string" &&
      String(values.get(settingKeyMap.appName)).trim()
        ? String(values.get(settingKeyMap.appName)).trim()
        : defaultAppSettings.appName,
    companyName:
      typeof values.get(settingKeyMap.companyName) === "string"
        ? String(values.get(settingKeyMap.companyName)).trim()
        : defaultAppSettings.companyName,
    systemContactEmail:
      typeof values.get(settingKeyMap.systemContactEmail) === "string"
        ? String(values.get(settingKeyMap.systemContactEmail)).trim()
        : defaultAppSettings.systemContactEmail,
    registrationEnabled:
      typeof values.get(settingKeyMap.registrationEnabled) === "boolean"
        ? Boolean(values.get(settingKeyMap.registrationEnabled))
        : defaultAppSettings.registrationEnabled,
    allowedEmailDomains: isStringArray(allowedEmailDomains)
      ? allowedEmailDomains.map(normalizeDomain).filter(Boolean)
      : defaultAppSettings.allowedEmailDomains,
    defaultApprovalRequired:
      typeof values.get(settingKeyMap.defaultApprovalRequired) === "boolean"
        ? Boolean(values.get(settingKeyMap.defaultApprovalRequired))
        : defaultAppSettings.defaultApprovalRequired,
    allowFacilityApprovalOverride:
      typeof approvalOverride === "boolean"
        ? approvalOverride
        : defaultAppSettings.allowFacilityApprovalOverride,
    defaultTimezone:
      typeof values.get(settingKeyMap.defaultTimezone) === "string" &&
      String(values.get(settingKeyMap.defaultTimezone)).trim()
        ? String(values.get(settingKeyMap.defaultTimezone)).trim()
        : defaultAppSettings.defaultTimezone,
    reminderOffsetsMinutes: isPositiveIntegerArray(reminderOffsets)
      ? [...new Set(reminderOffsets)].sort((a, b) => b - a)
      : defaultAppSettings.reminderOffsetsMinutes,
  };
}

export function appSettingsToRows(settings: AppSettings) {
  return [
    {
      key: settingKeyMap.appName,
      value: settings.appName,
      description: "Application display name.",
      is_public: true,
    },
    {
      key: settingKeyMap.companyName,
      value: settings.companyName,
      description: "Company display name.",
      is_public: true,
    },
    {
      key: settingKeyMap.systemContactEmail,
      value: settings.systemContactEmail,
      description: "Contact email shown for booking support.",
      is_public: true,
    },
    {
      key: settingKeyMap.registrationEnabled,
      value: settings.registrationEnabled,
      description: "Whether employee self-registration is enabled.",
      is_public: false,
    },
    {
      key: settingKeyMap.allowedEmailDomains,
      value: settings.allowedEmailDomains,
      description:
        "Allowed registration email domains. Empty means unrestricted until configured.",
      is_public: false,
    },
    {
      key: settingKeyMap.defaultApprovalRequired,
      value: settings.defaultApprovalRequired,
      description: "Whether new bookings require approval by default.",
      is_public: false,
    },
    {
      key: settingKeyMap.allowFacilityApprovalOverride,
      value: settings.allowFacilityApprovalOverride,
      description: "Whether facilities can override the default approval setting.",
      is_public: false,
    },
    {
      key: settingKeyMap.defaultTimezone,
      value: settings.defaultTimezone,
      description: "Default timezone for displaying booking times.",
      is_public: true,
    },
    {
      key: settingKeyMap.reminderOffsetsMinutes,
      value: settings.reminderOffsetsMinutes,
      description: "Reminder offsets before a confirmed booking starts.",
      is_public: false,
    },
  ];
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

