import "server-only";

import { Resend } from "resend";

import { createSmtpProvider } from "@/lib/email/providers/smtp";
import { normalizeEmailProviderName } from "@/lib/email/smtp-config";
import type { EmailMessage, EmailProvider, EmailSendResult } from "@/lib/email/types";

function configuredProviderName() {
  return normalizeEmailProviderName(process.env.EMAIL_PROVIDER);
}

function configErrorProvider(message: string): EmailProvider {
  return {
    name: "noop",
    async send(): Promise<EmailSendResult> {
      return {
        ok: false,
        provider: "noop",
        error: message,
      };
    },
  };
}

function createResendProvider(apiKey: string): EmailProvider {
  const resend = new Resend(apiKey);

  return {
    name: "resend",
    async send(message: EmailMessage): Promise<EmailSendResult> {
      try {
        const response = await resend.emails.send({
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });

        if (response.error) {
          return {
            ok: false,
            provider: "resend",
            error: response.error.message,
          };
        }

        return {
          ok: true,
          provider: "resend",
          messageId: response.data?.id ?? null,
        };
      } catch (error) {
        return {
          ok: false,
          provider: "resend",
          error:
            error instanceof Error
              ? error.message
              : "Resend failed to send the email.",
        };
      }
    },
  };
}

export function getEmailProvider(): EmailProvider {
  const provider = configuredProviderName();
  const apiKey = process.env.EMAIL_API_KEY?.trim();

  if (provider === "none") {
    return configErrorProvider(
      "Email provider is not configured. Set EMAIL_PROVIDER=resend or EMAIL_PROVIDER=smtp, then configure EMAIL_FROM and provider credentials.",
    );
  }

  if (provider === "resend") {
    if (!apiKey) {
      return configErrorProvider(
        "Email API key is missing. EMAIL_API_KEY must be configured server-side for Resend.",
      );
    }

    return createResendProvider(apiKey);
  }

  if (provider === "smtp") {
    return createSmtpProvider();
  }

  return configErrorProvider(
    "Unsupported email provider configured. Use EMAIL_PROVIDER=resend, EMAIL_PROVIDER=smtp, or leave it blank.",
  );
}

export function getEmailFromAddress() {
  return process.env.EMAIL_FROM?.trim() ?? "";
}
