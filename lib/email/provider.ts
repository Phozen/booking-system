import "server-only";

import { createSmtpProvider } from "@/lib/email/providers/smtp";
import { normalizeEmailProviderName } from "@/lib/email/smtp-config";
import type { EmailProvider, EmailSendResult } from "@/lib/email/types";

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

export function getEmailProvider(): EmailProvider {
  const provider = configuredProviderName();

  if (provider === "none") {
    return configErrorProvider(
      "Email provider is not configured. Set EMAIL_PROVIDER=smtp, then configure EMAIL_FROM and SMTP credentials.",
    );
  }

  if (provider === "smtp") {
    return createSmtpProvider();
  }

  return configErrorProvider(
    "Unsupported email provider configured. Use EMAIL_PROVIDER=smtp, or leave it blank.",
  );
}

export function getEmailFromAddress() {
  return process.env.EMAIL_FROM?.trim() ?? "";
}
