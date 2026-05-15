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
    .slice(0, 1000);
}
