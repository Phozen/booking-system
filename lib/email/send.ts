import "server-only";

import { getEmailAppUrlConfig } from "@/lib/email/app-url";
import { getEmailFromAddress, getEmailProvider } from "@/lib/email/provider";
import { renderEmailTemplate } from "@/lib/email/templates";
import type {
  EmailNotificationType,
  EmailSendResult,
  EmailTemplateData,
} from "@/lib/email/types";

export async function sendNotificationEmail({
  type,
  recipientEmail,
  subject,
  body,
  templateData,
}: {
  type: EmailNotificationType;
  recipientEmail: string;
  subject: string;
  body: string | null;
  templateData: EmailTemplateData;
}): Promise<EmailSendResult> {
  const provider = getEmailProvider();

  if (provider.name === "noop") {
    return provider.send({
      to: recipientEmail,
      from: getEmailFromAddress(),
      subject,
      html: "",
      text: "",
    });
  }

  const from = getEmailFromAddress();

  if (!from) {
    return {
      ok: false,
      provider: "noop",
      error:
        "Email sender is missing. EMAIL_FROM must be a verified sender or domain in the chosen provider.",
      };
  }

  const appUrlConfig = getEmailAppUrlConfig();

  if (!appUrlConfig.appUrl) {
    return {
      ok: false,
      provider: provider.name,
      error: appUrlConfig.validationError ?? "Qbook application URL is unavailable.",
    };
  }

  const rendered = renderEmailTemplate({
    type,
    recipientEmail,
    subject,
    body,
    templateData,
    appUrl: appUrlConfig.appUrl,
  });

  return provider.send({
    to: recipientEmail,
    from,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}
