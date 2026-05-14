import { describe, expect, it } from "vitest";

import {
  getSmtpConfigFromEnv,
  normalizeEmailProviderName,
  parseBooleanEnv,
  parseSmtpPort,
  sanitizeSmtpError,
  validateSmtpConfig,
} from "@/lib/email/smtp-config";

describe("email provider configuration", () => {
  it("normalizes blank email provider values to none", () => {
    expect(normalizeEmailProviderName(undefined)).toBe("none");
    expect(normalizeEmailProviderName("")).toBe("none");
    expect(normalizeEmailProviderName(" SMTP ")).toBe("smtp");
  });

  it("parses SMTP booleans and ports safely", () => {
    expect(parseBooleanEnv("true")).toBe(true);
    expect(parseBooleanEnv("1")).toBe(true);
    expect(parseBooleanEnv("false")).toBe(false);
    expect(parseBooleanEnv("", true)).toBe(true);

    expect(parseSmtpPort("587")).toBe(587);
    expect(parseSmtpPort("465")).toBe(465);
    expect(parseSmtpPort("not-a-port")).toBe(587);
    expect(parseSmtpPort("99999")).toBe(587);
  });

  it("builds Microsoft 365 compatible SMTP defaults", () => {
    const config = getSmtpConfigFromEnv({
      SMTP_HOST: "smtp.office365.com",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_REQUIRE_TLS: "true",
      SMTP_USER: "noreply@example.com",
      SMTP_PASSWORD: "secret-password",
    });

    expect(config).toEqual({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      requireTLS: true,
      user: "noreply@example.com",
      password: "secret-password",
    });
  });

  it("returns a configuration error for missing SMTP credentials", () => {
    expect(
      validateSmtpConfig({
        host: "",
        port: 587,
        secure: false,
        requireTLS: true,
        user: "",
        password: "",
      }),
    ).toBe(
      "SMTP email provider is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM.",
    );
  });

  it("sanitizes SMTP errors without returning secret-like details", () => {
    const error = new Error(
      "EAUTH Invalid login for noreply@example.com with password super-secret",
    );

    expect(sanitizeSmtpError(error)).toBe(
      "SMTP authentication failed. Check the mailbox credentials and confirm SMTP AUTH is enabled for the mailbox.",
    );
    expect(sanitizeSmtpError(error)).not.toContain("super-secret");
  });
});
