export type MicrosoftGraphEmailEnv = Record<string, string | undefined>;

export type MicrosoftGraphEmailConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  sender: string;
  missingKeys: string[];
  isConfigured: boolean;
  validationError: string | null;
};

function trimValue(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getMicrosoftGraphEmailConfig(
  env: MicrosoftGraphEmailEnv = process.env,
): MicrosoftGraphEmailConfig {
  const config = {
    tenantId: trimValue(env.EMAIL_MICROSOFT_TENANT_ID),
    clientId: trimValue(env.EMAIL_MICROSOFT_CLIENT_ID),
    clientSecret: env.EMAIL_MICROSOFT_CLIENT_SECRET ?? "",
    sender: trimValue(env.EMAIL_MICROSOFT_SENDER),
  };
  const requiredValues = [
    ["EMAIL_MICROSOFT_TENANT_ID", config.tenantId],
    ["EMAIL_MICROSOFT_CLIENT_ID", config.clientId],
    ["EMAIL_MICROSOFT_CLIENT_SECRET", config.clientSecret],
    ["EMAIL_MICROSOFT_SENDER", config.sender],
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
        ? `Microsoft Graph email is not configured. Set ${missingKeys.join(
            ", ",
          )}.`
        : null,
  };
}
