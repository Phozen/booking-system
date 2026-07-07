import {
  parseCalendarVisibilityMode,
  type CalendarVisibilityMode,
} from "@/lib/calendar/visibility";

export type AppSettings = {
  appName: string;
  companyName: string;
  systemContactEmail: string;
  registrationEnabled: boolean;
  allowedEmailDomains: string[];
  defaultApprovalRequired: boolean;
  allowFacilityApprovalOverride: boolean;
  recurringBookingsEnabled: boolean;
  calendarVisibilityMode: CalendarVisibilityMode;
  defaultTimezone: string;
  bookingWindowStart: string;
  bookingWindowEnd: string;
  reminderOffsetsMinutes: number[];
};

export type SystemSettingRow = {
  key: string;
  value: unknown;
};

export const baseDefaultAppSettings: AppSettings = {
  appName: "QBook",
  companyName: "",
  systemContactEmail: "",
  registrationEnabled: true,
  allowedEmailDomains: [],
  defaultApprovalRequired: false,
  allowFacilityApprovalOverride: true,
  recurringBookingsEnabled: false,
  calendarVisibilityMode: "my_bookings_only",
  defaultTimezone: "Asia/Kuala_Lumpur",
  bookingWindowStart: "08:00",
  bookingWindowEnd: "19:00",
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
  recurringBookingsEnabled: "recurring_bookings_enabled",
  calendarVisibilityMode: "calendar_visibility_mode",
  defaultTimezone: "default_timezone",
  bookingWindowStart: "booking_window_start",
  bookingWindowEnd: "booking_window_end",
  reminderOffsetsMinutes: "reminder_offsets_minutes",
} as const;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPositiveIntegerArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((item) => Number.isInteger(item) && item > 0)
  );
}

export function isBookingWindowTime(value: unknown): value is string {
  return typeof value === "string" && timePattern.test(value);
}

export function timeStringToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);

  return hour * 60 + minute;
}

export function formatBookingWindowTime(value: string) {
  const minutes = timeStringToMinutes(value);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatBookingWindowLabel(
  settings: Pick<AppSettings, "bookingWindowStart" | "bookingWindowEnd">,
) {
  return `${formatBookingWindowTime(settings.bookingWindowStart)} - ${formatBookingWindowTime(settings.bookingWindowEnd)}`;
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
  const rawBookingWindowStart = values.get(settingKeyMap.bookingWindowStart);
  const rawBookingWindowEnd = values.get(settingKeyMap.bookingWindowEnd);
  const hasValidBookingWindow =
    isBookingWindowTime(rawBookingWindowStart) &&
    isBookingWindowTime(rawBookingWindowEnd) &&
    timeStringToMinutes(rawBookingWindowStart) <
      timeStringToMinutes(rawBookingWindowEnd);
  const bookingWindowStart = hasValidBookingWindow
    ? rawBookingWindowStart
    : fallback.bookingWindowStart;
  const bookingWindowEnd = hasValidBookingWindow
    ? rawBookingWindowEnd
    : fallback.bookingWindowEnd;

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
    recurringBookingsEnabled:
      typeof values.get(settingKeyMap.recurringBookingsEnabled) === "boolean"
        ? Boolean(values.get(settingKeyMap.recurringBookingsEnabled))
        : fallback.recurringBookingsEnabled,
    calendarVisibilityMode: parseCalendarVisibilityMode(
      values.get(settingKeyMap.calendarVisibilityMode) ??
        fallback.calendarVisibilityMode,
    ),
    defaultTimezone:
      typeof values.get(settingKeyMap.defaultTimezone) === "string" &&
      String(values.get(settingKeyMap.defaultTimezone)).trim()
        ? String(values.get(settingKeyMap.defaultTimezone)).trim()
        : fallback.defaultTimezone,
    bookingWindowStart,
    bookingWindowEnd,
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
      key: settingKeyMap.recurringBookingsEnabled,
      value: settings.recurringBookingsEnabled,
      description:
        "Whether employees can create recurring booking series.",
      is_public: false,
    },
    {
      key: settingKeyMap.calendarVisibilityMode,
      value: settings.calendarVisibilityMode,
      description:
        "Controls who can view all-user bookings on calendar pages.",
      is_public: false,
    },
    {
      key: settingKeyMap.defaultTimezone,
      value: settings.defaultTimezone,
      description: "Default timezone for displaying booking times.",
      is_public: true,
    },
    {
      key: settingKeyMap.bookingWindowStart,
      value: settings.bookingWindowStart,
      description: "Earliest time of day users can start a booking.",
      is_public: true,
    },
    {
      key: settingKeyMap.bookingWindowEnd,
      value: settings.bookingWindowEnd,
      description: "Latest time of day users can end a booking.",
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
