import "server-only";

import type { MicrosoftGraphEmailConfig } from "@/lib/email/microsoft-graph-config";
import type { EmailMessage, EmailProvider, EmailSendResult } from "@/lib/email/types";

type CachedToken = {
  accessToken: string;
  expiresAt: number;
  configKey: string;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
};

let cachedToken: CachedToken | null = null;

function getConfigKey(config: MicrosoftGraphEmailConfig) {
  return `${config.tenantId}:${config.clientId}:${config.clientSecret}`;
}

async function getAccessToken(config: MicrosoftGraphEmailConfig) {
  const now = Date.now();
  const configKey = getConfigKey(config);

  if (
    cachedToken &&
    cachedToken.configKey === configKey &&
    cachedToken.expiresAt > now + 60_000
  ) {
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

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
  } catch {
    throw new Error("Microsoft Graph email token service could not be reached.");
  }

  const payload = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(
      "Microsoft Graph email authentication failed. Check the Entra app credentials and Mail.Send admin consent.",
    );
  }

  const expiresInSeconds = Math.max(payload.expires_in ?? 3600, 300);
  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: now + (expiresInSeconds - 120) * 1000,
    configKey,
  };

  return payload.access_token;
}

function failureForResponse(status: number) {
  if (status === 401 || status === 403) {
    return "Microsoft Graph email authorization failed. Confirm Mail.Send consent and that the app is scoped to the configured sender mailbox.";
  }

  if (status === 429 || status >= 500) {
    return "Microsoft Graph email is temporarily unavailable. The queued notification will retry.";
  }

  return "Microsoft Graph rejected the email. Check the configured sender mailbox and recipient address.";
}

export function createMicrosoftGraphEmailProvider(
  config: MicrosoftGraphEmailConfig,
): EmailProvider {
  return {
    name: "microsoft_graph",
    async send(message: EmailMessage): Promise<EmailSendResult> {
      if (!config.isConfigured) {
        return {
          ok: false,
          provider: "microsoft_graph",
          error:
            config.validationError ?? "Microsoft Graph email is not configured.",
        };
      }

      try {
        const accessToken = await getAccessToken(config);
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
            config.sender,
          )}/sendMail`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                subject: message.subject,
                body: {
                  contentType: "HTML",
                  content: message.html,
                },
                toRecipients: [
                  { emailAddress: { address: message.to } },
                ],
              },
              saveToSentItems: true,
            }),
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return {
            ok: false,
            provider: "microsoft_graph",
            error: failureForResponse(response.status),
          };
        }

        // Graph sendMail accepts a message for asynchronous delivery and does
        // not return a provider message ID for the queue to persist.
        return { ok: true, provider: "microsoft_graph", messageId: null };
      } catch (error) {
        return {
          ok: false,
          provider: "microsoft_graph",
          error:
            error instanceof Error
              ? error.message
              : "Microsoft Graph email failed to send.",
        };
      }
    },
  };
}
