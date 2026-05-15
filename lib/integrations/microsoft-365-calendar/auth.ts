import "server-only";

import { getMicrosoftCalendarSyncConfig } from "@/lib/integrations/microsoft-365-calendar/config";
import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export async function getMicrosoftGraphAccessToken() {
  const config = getMicrosoftCalendarSyncConfig();

  if (!config.enabled || config.mode === "disabled") {
    throw new Error("Microsoft 365 Calendar sync is disabled.");
  }

  if (!config.isConfigured) {
    throw new Error(
      config.validationError ??
        "Microsoft 365 Calendar sync is not configured.",
    );
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
    config.tenantId,
  )}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as TokenResponse;

    if (!response.ok || !payload.access_token) {
      const details = payload.error_description || payload.error || response.statusText;
      throw new Error(
        `Microsoft identity token request failed (${response.status}): ${details}`,
      );
    }

    const expiresInSeconds = Math.max(payload.expires_in ?? 3600, 300);
    cachedToken = {
      accessToken: payload.access_token,
      expiresAt: now + (expiresInSeconds - 120) * 1000,
    };

    return payload.access_token;
  } catch (error) {
    throw new Error(sanitizeMicrosoftCalendarError(error));
  }
}
