export type EmailNotificationType =
  | "booking_confirmation"
  | "booking_approval"
  | "booking_rejection"
  | "booking_cancellation"
  | "booking_reminder";

export type EmailNotificationStatus =
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export type EmailTemplateData = Record<string, unknown>;

export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailSendResult =
  | {
      ok: true;
      provider: string;
      messageId: string | null;
    }
  | {
      ok: false;
      provider: string;
      error: string;
    };

export type EmailProvider = {
  name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
};

export type EmailTemplateInput = {
  type: EmailNotificationType;
  subject: string;
  body: string | null;
  templateData: EmailTemplateData;
  appUrl: string;
  recipientEmail: string;
};

export type RenderedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};
