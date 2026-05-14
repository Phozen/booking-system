import "server-only";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const rendered = renderEmailTemplate({
    type,
    recipientEmail,
    subject,
    body,
    templateData,
    appUrl,
  });

  return provider.send({
    to: recipientEmail,
    from,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}
