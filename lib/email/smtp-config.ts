export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  user: string;
  password: string;
};

export function normalizeEmailProviderName(value: string | undefined | null) {
  const provider = value?.trim().toLowerCase();
  return provider || "none";
}

export function parseBooleanEnv(
  value: string | undefined | null,
  defaultValue = false,
) {
  if (value == null || value.trim() === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function parseSmtpPort(value: string | undefined | null) {
  if (value == null || value.trim() === "") {
    return 587;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    return 587;
  }

  return port;
}

export function getSmtpConfigFromEnv(
  env: Partial<Record<string, string | undefined>> = process.env,
): SmtpConfig {
  return {
    host: env.SMTP_HOST?.trim() ?? "",
    port: parseSmtpPort(env.SMTP_PORT),
    secure: parseBooleanEnv(env.SMTP_SECURE, false),
    requireTLS: parseBooleanEnv(env.SMTP_REQUIRE_TLS, true),
    user: env.SMTP_USER?.trim() ?? "",
    password: env.SMTP_PASSWORD ?? "",
  };
}

export function validateSmtpConfig(config: SmtpConfig) {
  const missing: string[] = [];

  if (!config.host) {
    missing.push("SMTP_HOST");
  }

  if (!config.user) {
    missing.push("SMTP_USER");
  }

  if (!config.password) {
    missing.push("SMTP_PASSWORD");
  }

  if (missing.length > 0) {
    return `SMTP email provider is not configured. Set ${missing.join(", ")} and EMAIL_FROM.`;
  }

  return null;
}

export function sanitizeSmtpError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (/EAUTH|auth|credential|invalid login|535|5\.7\.3/i.test(message)) {
    return "SMTP authentication failed. Check the mailbox credentials and confirm SMTP AUTH is enabled for the mailbox.";
  }

  if (
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNECTION|timeout|connection/i.test(
      message,
    )
  ) {
    return "SMTP server could not be reached. Check SMTP_HOST, SMTP_PORT, and network access.";
  }

  if (/STARTTLS|TLS|SSL|certificate|self-signed/i.test(message)) {
    return "SMTP TLS negotiation failed. Check SMTP_SECURE, SMTP_REQUIRE_TLS, and the server certificate settings.";
  }

  return "SMTP failed to send the email. Check SMTP provider configuration and mailbox permissions.";
}
