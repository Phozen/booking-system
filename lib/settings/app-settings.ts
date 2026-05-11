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

export type SystemSettingRow = {
  key: string;
  value: unknown;
};

export const baseDefaultAppSettings: AppSettings = {
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

export const settingKeyMap = {
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPositiveIntegerArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((item) => Number.isInteger(item) && item > 0)
  );
}

export function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "");
}

export function mapSettingsRowsToAppSettings(
  rows: SystemSettingRow[],
  fallback: AppSettings = baseDefaultAppSettings,
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
        : fallback.appName,
    companyName:
      typeof values.get(settingKeyMap.companyName) === "string"
        ? String(values.get(settingKeyMap.companyName)).trim()
        : fallback.companyName,
    systemContactEmail:
      typeof values.get(settingKeyMap.systemContactEmail) === "string"
        ? String(values.get(settingKeyMap.systemContactEmail)).trim()
        : fallback.systemContactEmail,
    registrationEnabled:
      typeof values.get(settingKeyMap.registrationEnabled) === "boolean"
        ? Boolean(values.get(settingKeyMap.registrationEnabled))
        : fallback.registrationEnabled,
    allowedEmailDomains: isStringArray(allowedEmailDomains)
      ? allowedEmailDomains.map(normalizeDomain).filter(Boolean)
      : fallback.allowedEmailDomains,
    defaultApprovalRequired:
      typeof values.get(settingKeyMap.defaultApprovalRequired) === "boolean"
        ? Boolean(values.get(settingKeyMap.defaultApprovalRequired))
        : fallback.defaultApprovalRequired,
    allowFacilityApprovalOverride:
      typeof approvalOverride === "boolean"
        ? approvalOverride
        : fallback.allowFacilityApprovalOverride,
    defaultTimezone:
      typeof values.get(settingKeyMap.defaultTimezone) === "string" &&
      String(values.get(settingKeyMap.defaultTimezone)).trim()
        ? String(values.get(settingKeyMap.defaultTimezone)).trim()
        : fallback.defaultTimezone,
    reminderOffsetsMinutes: isPositiveIntegerArray(reminderOffsets)
      ? [...new Set(reminderOffsets)].sort((a, b) => b - a)
      : fallback.reminderOffsetsMinutes,
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

export function getCompanyDisplayName(settings: Pick<AppSettings, "companyName">) {
  return settings.companyName.trim() || "your company";
}

export function getSystemContactEmail(
  settings: Pick<AppSettings, "systemContactEmail">,
) {
  const email = settings.systemContactEmail.trim();
  return email || null;
}

export function formatContactAdministratorMessage(
  settings: Pick<AppSettings, "systemContactEmail">,
) {
  const email = getSystemContactEmail(settings);
  return email ? `Contact ${email} for help.` : "Contact an administrator for help.";
}

export function formatRegistrationDisabledMessage(
  settings: Pick<AppSettings, "systemContactEmail">,
) {
  return `Registration is currently disabled. ${formatContactAdministratorMessage(settings)}`;
}

export function formatAccountInactiveMessage(
  settings: Pick<AppSettings, "systemContactEmail">,
) {
  return `Your account is not active. ${formatContactAdministratorMessage(settings)}`;
}

export function formatAllowedEmailDomains(domains: string[]) {
  if (domains.length === 0) {
    return "Any valid email domain is allowed.";
  }

  return domains.join(", ");
}

export function getEffectiveApprovalRequired(
  facilityRequiresApproval: boolean | null,
  settings: Pick<
    AppSettings,
    "allowFacilityApprovalOverride" | "defaultApprovalRequired"
  >,
) {
  if (
    settings.allowFacilityApprovalOverride &&
    facilityRequiresApproval !== null
  ) {
    return facilityRequiresApproval;
  }

  return settings.defaultApprovalRequired;
}

export function formatEffectiveApprovalLabel(
  facilityRequiresApproval: boolean | null,
  settings: Pick<
    AppSettings,
    "allowFacilityApprovalOverride" | "defaultApprovalRequired"
  >,
) {
  return getEffectiveApprovalRequired(facilityRequiresApproval, settings)
    ? "Approval required"
    : "No approval required";
}

export function formatEffectiveApprovalCopy(
  facilityRequiresApproval: boolean | null,
  settings: Pick<
    AppSettings,
    "allowFacilityApprovalOverride" | "defaultApprovalRequired"
  >,
) {
  const effectiveApprovalRequired = getEffectiveApprovalRequired(
    facilityRequiresApproval,
    settings,
  );
  const usesFacilityOverride =
    settings.allowFacilityApprovalOverride && facilityRequiresApproval !== null;

  if (usesFacilityOverride) {
    return effectiveApprovalRequired
      ? "Bookings for this facility require admin approval."
      : "Bookings for this facility are confirmed automatically when available.";
  }

  return effectiveApprovalRequired
    ? "System settings require admin approval for bookings in this facility."
    : "System settings allow automatic confirmation when this facility is available.";
}
