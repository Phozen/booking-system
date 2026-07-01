export const microsoftCalendarSyncModes = [
  "disabled",
  "central_calendar",
  "booking_owner_calendar",
  "facility_calendars",
] as const;

export const calendarSyncProviders = [
  "disabled",
  "microsoft_graph",
  "n8n_webhook",
] as const;

export const microsoftGraphAuthModes = ["app_only", "delegated"] as const;

export type MicrosoftCalendarSyncMode =
  (typeof microsoftCalendarSyncModes)[number];

export type CalendarSyncProvider = (typeof calendarSyncProviders)[number];

export type MicrosoftGraphAuthMode = (typeof microsoftGraphAuthModes)[number];

export type MicrosoftCalendarSyncEnv = Record<string, string | undefined>;

export type MicrosoftCalendarSyncConfig = {
  provider: CalendarSyncProvider;
  enabled: boolean;
  mode: MicrosoftCalendarSyncMode;
  graphAuthMode: MicrosoftGraphAuthMode;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  delegatedTokenEncryptionKey: string;
  defaultCalendarId: string;
  graphBaseUrl: string;
  missingKeys: string[];
  isConfigured: boolean;
  validationError: string | null;
};

export type N8nCalendarSyncConfig = {
  provider: CalendarSyncProvider;
  enabled: boolean;
  createWebhookUrl: string;
  updateWebhookUrl: string;
  deleteWebhookUrl: string;
  webhookSecret: string;
  missingKeys: string[];
  isConfigured: boolean;
  validationError: string | null;
  createWebhookConfigured: boolean;
  updateWebhookConfigured: boolean;
  deleteWebhookConfigured: boolean;
  createWebhookUsesTestUrl: boolean;
  lifecycleMode: "create_only" | "full_lifecycle";
};

const defaultGraphBaseUrl = "https://graph.microsoft.com/v1.0";

export function trimValue(value: string | undefined) {
  return value?.trim() ?? "";
}

export function parseBoolean(value: string | undefined, fallback = false) {
  const normalized = trimValue(value).toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function parseCalendarSyncProvider(
  value: string | undefined,
): CalendarSyncProvider {
  const normalized = trimValue(value).toLowerCase();

  return calendarSyncProviders.includes(normalized as CalendarSyncProvider)
    ? (normalized as CalendarSyncProvider)
    : "disabled";
}

function getCalendarSyncProvider(
  env: MicrosoftCalendarSyncEnv,
): CalendarSyncProvider {
  const configuredProvider = trimValue(env.CALENDAR_SYNC_PROVIDER);

  if (configuredProvider) {
    return parseCalendarSyncProvider(configuredProvider);
  }

  return parseBoolean(env.MICROSOFT_365_CALENDAR_SYNC_ENABLED, false)
    ? "microsoft_graph"
    : "disabled";
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

export function parseMicrosoftGraphAuthMode(
  value: string | undefined,
): MicrosoftGraphAuthMode {
  const normalized = trimValue(value).toLowerCase();

  return microsoftGraphAuthModes.includes(normalized as MicrosoftGraphAuthMode)
    ? (normalized as MicrosoftGraphAuthMode)
    : "app_only";
}

export function getMicrosoftCalendarSyncConfig(
  env: MicrosoftCalendarSyncEnv = process.env,
): MicrosoftCalendarSyncConfig {
  const provider = getCalendarSyncProvider(env);
  const enabled =
    provider === "microsoft_graph" &&
    parseBoolean(env.MICROSOFT_365_CALENDAR_SYNC_ENABLED, false);
  const mode = enabled
    ? parseMicrosoftCalendarSyncMode(env.MICROSOFT_SYNC_MODE)
    : "disabled";

  const config = {
    enabled,
    mode,
    graphAuthMode: parseMicrosoftGraphAuthMode(env.MICROSOFT_GRAPH_AUTH_MODE),
    tenantId: trimValue(env.MICROSOFT_TENANT_ID),
    clientId: trimValue(env.MICROSOFT_CLIENT_ID),
    clientSecret: env.MICROSOFT_CLIENT_SECRET ?? "",
    delegatedTokenEncryptionKey:
      env.MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY ?? "",
    defaultCalendarId: trimValue(env.MICROSOFT_DEFAULT_CALENDAR_ID),
    graphBaseUrl:
      trimValue(env.MICROSOFT_GRAPH_BASE_URL) || defaultGraphBaseUrl,
  };

  if (!config.enabled || config.mode === "disabled") {
    return {
      ...config,
      provider,
      missingKeys: [],
      isConfigured: false,
      validationError: null,
    };
  }

  const requiredValues = [
    ["MICROSOFT_TENANT_ID", config.tenantId],
    ["MICROSOFT_CLIENT_ID", config.clientId],
    ["MICROSOFT_CLIENT_SECRET", config.clientSecret],
    ...(config.graphAuthMode === "delegated"
      ? ([
          [
            "MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY",
            config.delegatedTokenEncryptionKey,
          ],
        ] as const)
      : []),
    ...(config.mode === "central_calendar"
      ? ([["MICROSOFT_DEFAULT_CALENDAR_ID", config.defaultCalendarId]] as const)
      : []),
  ] as const;
  const missingKeys = requiredValues
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const authModeError =
    config.graphAuthMode === "delegated" && config.mode !== "booking_owner_calendar"
      ? "Delegated Microsoft Graph auth is only supported for booking-owner calendar sync."
      : null;

  return {
    ...config,
    provider,
    missingKeys,
    isConfigured: missingKeys.length === 0 && !authModeError,
    validationError:
      missingKeys.length > 0
        ? `Microsoft 365 Calendar sync is not configured. Set ${missingKeys.join(
            ", ",
          )}.`
        : authModeError
          ? authModeError
        : null,
  };
}

export function getN8nCalendarSyncConfig(
  env: MicrosoftCalendarSyncEnv = process.env,
): N8nCalendarSyncConfig {
  const provider = getCalendarSyncProvider(env);
  const enabled =
    provider === "n8n_webhook" &&
    parseBoolean(env.N8N_CALENDAR_SYNC_ENABLED, false);
  const createWebhookUrl = trimValue(env.N8N_CALENDAR_CREATE_WEBHOOK_URL);
  const updateWebhookUrl = trimValue(env.N8N_CALENDAR_UPDATE_WEBHOOK_URL);
  const deleteWebhookUrl = trimValue(env.N8N_CALENDAR_DELETE_WEBHOOK_URL);
  const webhookSecret = env.N8N_CALENDAR_WEBHOOK_SECRET ?? "";
  const createWebhookUsesTestUrl = createWebhookUrl.includes("/webhook-test/");
  const lifecycleMode: N8nCalendarSyncConfig["lifecycleMode"] =
    updateWebhookUrl && deleteWebhookUrl ? "full_lifecycle" : "create_only";
  const baseConfig = {
    provider,
    enabled,
    createWebhookUrl,
    updateWebhookUrl,
    deleteWebhookUrl,
    webhookSecret,
    createWebhookConfigured: Boolean(createWebhookUrl),
    updateWebhookConfigured: Boolean(updateWebhookUrl),
    deleteWebhookConfigured: Boolean(deleteWebhookUrl),
    createWebhookUsesTestUrl,
    lifecycleMode,
  };

  if (!enabled) {
    return {
      ...baseConfig,
      missingKeys: [],
      isConfigured: false,
      validationError: null,
    };
  }

  const requiredValues = [
    ["N8N_CALENDAR_CREATE_WEBHOOK_URL", createWebhookUrl],
    ["N8N_CALENDAR_WEBHOOK_SECRET", webhookSecret],
  ] as const;
  const missingKeys = requiredValues
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const testUrlError =
    createWebhookUsesTestUrl &&
    (env.VERCEL_ENV === "production" || env.NODE_ENV === "production")
      ? "n8n calendar create webhook uses a test URL. Use the production /webhook/ URL in production."
      : null;

  return {
    ...baseConfig,
    missingKeys,
    isConfigured: missingKeys.length === 0 && !testUrlError,
    validationError:
      missingKeys.length > 0
        ? `n8n calendar webhook sync is not configured. Set ${missingKeys.join(
            ", ",
          )}.`
        : testUrlError
          ? testUrlError
        : null,
  };
}

export function getCalendarSyncProviderSummary(
  env: MicrosoftCalendarSyncEnv = process.env,
) {
  const provider = getCalendarSyncProvider(env);
  const microsoftGraph = getMicrosoftCalendarSyncConfig(env);
  const n8nWebhook = getN8nCalendarSyncConfig(env);

  return {
    provider,
    microsoftGraph,
    n8nWebhook,
  };
}
