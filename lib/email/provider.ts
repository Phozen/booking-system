import "server-only";

import { Resend } from "resend";

import type { EmailMessage, EmailProvider, EmailSendResult } from "@/lib/email/types";

function configuredProviderName() {
  return (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
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

  if (!provider) {
    return configErrorProvider(
      "Email provider is not configured. Set EMAIL_PROVIDER=resend, EMAIL_API_KEY, and EMAIL_FROM.",
    );
  }

  if (!apiKey) {
    return configErrorProvider(
      "Email API key is missing. EMAIL_API_KEY must be configured server-side.",
    );
  }

  if (provider === "resend") {
    return createResendProvider(apiKey);
  }

  return configErrorProvider(`Unsupported email provider: ${provider}.`);
}

export function getEmailFromAddress() {
  return process.env.EMAIL_FROM?.trim() ?? "";
}
