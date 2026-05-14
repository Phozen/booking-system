import "server-only";

import nodemailer from "nodemailer";

import {
  getSmtpConfigFromEnv,
  sanitizeSmtpError,
  validateSmtpConfig,
} from "@/lib/email/smtp-config";
import type { EmailMessage, EmailProvider, EmailSendResult } from "@/lib/email/types";

export function createSmtpProvider(): EmailProvider {
  const config = getSmtpConfigFromEnv();
  const configError = validateSmtpConfig(config);

  if (configError) {
    return {
      name: "smtp",
      async send(): Promise<EmailSendResult> {
        return {
          ok: false,
          provider: "smtp",
          error: configError,
        };
      },
    };
  }

  return {
    name: "smtp",
    async send(message: EmailMessage): Promise<EmailSendResult> {
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          requireTLS: config.requireTLS,
          auth: {
            user: config.user,
            pass: config.password,
          },
        });

        const info = await transporter.sendMail({
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });

        return {
          ok: true,
          provider: "smtp",
          messageId:
            typeof info.messageId === "string" && info.messageId
              ? info.messageId
              : null,
        };
      } catch (error) {
        return {
          ok: false,
          provider: "smtp",
          error: sanitizeSmtpError(error),
        };
      }
    },
  };
}
