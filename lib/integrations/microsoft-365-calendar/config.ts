export const microsoftCalendarSyncModes = [
  "disabled",
  "central_calendar",
  "facility_calendars",
] as const;

export type MicrosoftCalendarSyncMode =
  (typeof microsoftCalendarSyncModes)[number];

export type MicrosoftCalendarSyncEnv = Record<string, string | undefined>;

export type MicrosoftCalendarSyncConfig = {
  enabled: boolean;
  mode: MicrosoftCalendarSyncMode;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  defaultCalendarId: string;
  graphBaseUrl: string;
  missingKeys: string[];
  isConfigured: boolean;
  validationError: string | null;
};

const defaultGraphBaseUrl = "https://graph.microsoft.com/v1.0";

function trimValue(value: string | undefined) {
  return value?.trim() ?? "";
}

function parseBoolean(value: string | undefined, fallback = false) {
  const normalized = trimValue(value).toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function parseMicrosoftCalendarSyncMode(
  value: string | undefined,
): MicrosoftCalendarSyncMode {
  const normalized = trimValue(value).toLowerCase();

  return microsoftCalendarSyncModes.includes(
    normalized as MicrosoftCalendarSyncMode,
  )
    ? (normalized as MicrosoftCalendarSyncMode)
    : "disabled";
}

export function getMicrosoftCalendarSyncConfig(
  env: MicrosoftCalendarSyncEnv = process.env,
): MicrosoftCalendarSyncConfig {
  const enabled = parseBoolean(
    env.MICROSOFT_365_CALENDAR_SYNC_ENABLED,
    false,
  );
  const mode = enabled
    ? parseMicrosoftCalendarSyncMode(env.MICROSOFT_SYNC_MODE)
    : "disabled";

  const config = {
    enabled,
    mode,
    tenantId: trimValue(env.MICROSOFT_TENANT_ID),
    clientId: trimValue(env.MICROSOFT_CLIENT_ID),
    clientSecret: env.MICROSOFT_CLIENT_SECRET ?? "",
    defaultCalendarId: trimValue(env.MICROSOFT_DEFAULT_CALENDAR_ID),
    graphBaseUrl:
      trimValue(env.MICROSOFT_GRAPH_BASE_URL) || defaultGraphBaseUrl,
  };

  if (!config.enabled || config.mode === "disabled") {
    return {
      ...config,
      missingKeys: [],
      isConfigured: false,
      validationError: null,
    };
  }

  const requiredValues = [
    ["MICROSOFT_TENANT_ID", config.tenantId],
    ["MICROSOFT_CLIENT_ID", config.clientId],
    ["MICROSOFT_CLIENT_SECRET", config.clientSecret],
    ["MICROSOFT_DEFAULT_CALENDAR_ID", config.defaultCalendarId],
  ] as const;
  const missingKeys = requiredValues
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    ...config,
    missingKeys,
    isConfigured: missingKeys.length === 0,
    validationError:
      missingKeys.length > 0
        ? `Microsoft 365 Calendar sync is not configured. Set ${missingKeys.join(
            ", ",
          )}.`
        : null,
  };
}
