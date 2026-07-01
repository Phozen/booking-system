export function sanitizeMicrosoftCalendarError(error: unknown) {
  const fallback = "Microsoft 365 Calendar sync failed.";

  if (!error) {
    return fallback;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/client_secret=[^&\s]+/gi, "client_secret=[redacted]")
    .replace(/access_token["':=\s]+[^"',\s}]+/gi, "access_token=[redacted]")
    .replace(/refresh_token["':=\s]+[^"',\s}]+/gi, "refresh_token=[redacted]")
    .replace(/MICROSOFT_CLIENT_SECRET=([^,\s]+)/gi, "MICROSOFT_CLIENT_SECRET=[redacted]")
    .replace(
      /MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY=([^,\s]+)/gi,
      "MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY=[redacted]",
    )
    .replace(/N8N_CALENDAR_WEBHOOK_SECRET=([^,\s]+)/gi, "N8N_CALENDAR_WEBHOOK_SECRET=[redacted]")
    .replace(/x-booking-system-secret["':=\s]+[^"',\s}]+/gi, "x-booking-system-secret=[redacted]")
    .replace(/https?:\/\/[^\s"',}]*webhook[^\s"',}]*/gi, "[redacted webhook url]")
    .slice(0, 1000);
}
