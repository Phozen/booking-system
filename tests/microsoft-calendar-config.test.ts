import { describe, expect, it } from "vitest";

import {
  getCalendarSyncProviderSummary,
  getMicrosoftCalendarSyncConfig,
  getN8nCalendarSyncConfig,
  parseCalendarSyncProvider,
  parseMicrosoftCalendarSyncMode,
} from "@/lib/integrations/microsoft-365-calendar/config";

describe("Microsoft 365 calendar sync config", () => {
  it("is disabled by default", () => {
    const config = getMicrosoftCalendarSyncConfig({});

    expect(config.enabled).toBe(false);
    expect(config.mode).toBe("disabled");
    expect(config.isConfigured).toBe(false);
    expect(config.validationError).toBeNull();
  });

  it("keeps sync disabled when the enabled flag is false", () => {
    const config = getMicrosoftCalendarSyncConfig({
      MICROSOFT_365_CALENDAR_SYNC_ENABLED: "false",
      MICROSOFT_SYNC_MODE: "central_calendar",
      MICROSOFT_TENANT_ID: "tenant",
      MICROSOFT_CLIENT_ID: "client",
      MICROSOFT_CLIENT_SECRET: "super-secret-value",
      MICROSOFT_DEFAULT_CALENDAR_ID: "calendar",
    });

    expect(config.enabled).toBe(false);
    expect(config.mode).toBe("disabled");
    expect(config.missingKeys).toEqual([]);
  });

  it("supports explicit calendar sync providers", () => {
    expect(parseCalendarSyncProvider("microsoft_graph")).toBe(
      "microsoft_graph",
    );
    expect(parseCalendarSyncProvider("n8n_webhook")).toBe("n8n_webhook");
    expect(parseCalendarSyncProvider("unknown")).toBe("disabled");
  });

  it("keeps n8n disabled until the n8n enabled flag is true", () => {
    const config = getN8nCalendarSyncConfig({
      CALENDAR_SYNC_PROVIDER: "n8n_webhook",
      N8N_CALENDAR_SYNC_ENABLED: "false",
      N8N_CALENDAR_CREATE_WEBHOOK_URL: "https://n8n.example/webhook/create",
      N8N_CALENDAR_WEBHOOK_SECRET: "super-secret-value",
    });

    expect(config.enabled).toBe(false);
    expect(config.isConfigured).toBe(false);
    expect(config.missingKeys).toEqual([]);
  });

  it("requires n8n create webhook config only when n8n sync is enabled", () => {
    const config = getN8nCalendarSyncConfig({
      CALENDAR_SYNC_PROVIDER: "n8n_webhook",
      N8N_CALENDAR_SYNC_ENABLED: "true",
      N8N_CALENDAR_WEBHOOK_SECRET: "super-secret-value",
    });

    expect(config.enabled).toBe(true);
    expect(config.isConfigured).toBe(false);
    expect(config.missingKeys).toEqual(["N8N_CALENDAR_CREATE_WEBHOOK_URL"]);
    expect(config.validationError).not.toContain("super-secret-value");
  });

  it("reports n8n webhook URL presence without exposing values", () => {
    const config = getCalendarSyncProviderSummary({
      CALENDAR_SYNC_PROVIDER: "n8n_webhook",
      N8N_CALENDAR_SYNC_ENABLED: "true",
      N8N_CALENDAR_CREATE_WEBHOOK_URL: "https://n8n.example/webhook/create",
      N8N_CALENDAR_UPDATE_WEBHOOK_URL: "https://n8n.example/webhook/update",
      N8N_CALENDAR_WEBHOOK_SECRET: "super-secret-value",
    });

    expect(config.provider).toBe("n8n_webhook");
    expect(config.n8nWebhook.isConfigured).toBe(true);
    expect(config.n8nWebhook.createWebhookConfigured).toBe(true);
    expect(config.n8nWebhook.updateWebhookConfigured).toBe(true);
    expect(config.n8nWebhook.deleteWebhookConfigured).toBe(false);
    expect(config.n8nWebhook.lifecycleMode).toBe("create_only");
    expect(config.n8nWebhook.validationError).toBeNull();
  });

  it("allows blank n8n update and delete URLs for create-only testing", () => {
    const config = getN8nCalendarSyncConfig({
      CALENDAR_SYNC_PROVIDER: "n8n_webhook",
      N8N_CALENDAR_SYNC_ENABLED: "true",
      N8N_CALENDAR_CREATE_WEBHOOK_URL:
        "https://n.qsbportal.com.my/webhook/booking-calendar/create",
      N8N_CALENDAR_WEBHOOK_SECRET: "super-secret-value",
      MICROSOFT_365_CALENDAR_SYNC_ENABLED: "false",
      MICROSOFT_SYNC_MODE: "disabled",
    });

    expect(config.enabled).toBe(true);
    expect(config.isConfigured).toBe(true);
    expect(config.createWebhookConfigured).toBe(true);
    expect(config.updateWebhookConfigured).toBe(false);
    expect(config.deleteWebhookConfigured).toBe(false);
    expect(config.lifecycleMode).toBe("create_only");
  });

  it("enables n8n full lifecycle mode when update and delete URLs are configured", () => {
    const config = getN8nCalendarSyncConfig({
      CALENDAR_SYNC_PROVIDER: "n8n_webhook",
      N8N_CALENDAR_SYNC_ENABLED: "true",
      N8N_CALENDAR_CREATE_WEBHOOK_URL:
        "https://n.qsbportal.com.my/webhook/booking-calendar/create",
      N8N_CALENDAR_UPDATE_WEBHOOK_URL:
        "https://n.qsbportal.com.my/webhook/booking-calendar/update",
      N8N_CALENDAR_DELETE_WEBHOOK_URL:
        "https://n.qsbportal.com.my/webhook/booking-calendar/delete",
      N8N_CALENDAR_WEBHOOK_SECRET: "super-secret-value",
    });

    expect(config.isConfigured).toBe(true);
    expect(config.createWebhookConfigured).toBe(true);
    expect(config.updateWebhookConfigured).toBe(true);
    expect(config.deleteWebhookConfigured).toBe(true);
    expect(config.lifecycleMode).toBe("full_lifecycle");
  });

  it("rejects n8n test webhook URLs in production", () => {
    const config = getN8nCalendarSyncConfig({
      CALENDAR_SYNC_PROVIDER: "n8n_webhook",
      N8N_CALENDAR_SYNC_ENABLED: "true",
      N8N_CALENDAR_CREATE_WEBHOOK_URL:
        "https://n.qsbportal.com.my/webhook-test/booking-calendar/create",
      N8N_CALENDAR_WEBHOOK_SECRET: "super-secret-value",
      VERCEL_ENV: "production",
    });

    expect(config.createWebhookUsesTestUrl).toBe(true);
    expect(config.isConfigured).toBe(false);
    expect(config.validationError).toContain("production /webhook/ URL");
    expect(config.validationError).not.toContain("super-secret-value");
  });

  it("requires Microsoft credentials for enabled central-calendar sync", () => {
    const config = getMicrosoftCalendarSyncConfig({
      MICROSOFT_365_CALENDAR_SYNC_ENABLED: "true",
      MICROSOFT_SYNC_MODE: "central_calendar",
      MICROSOFT_CLIENT_SECRET: "super-secret-value",
    });

    expect(config.enabled).toBe(true);
    expect(config.mode).toBe("central_calendar");
    expect(config.isConfigured).toBe(false);
    expect(config.missingKeys).toEqual([
      "MICROSOFT_TENANT_ID",
      "MICROSOFT_CLIENT_ID",
      "MICROSOFT_DEFAULT_CALENDAR_ID",
    ]);
    expect(config.validationError).not.toContain("super-secret-value");
  });

  it("uses the Microsoft Graph base URL fallback", () => {
    const config = getMicrosoftCalendarSyncConfig({
      MICROSOFT_365_CALENDAR_SYNC_ENABLED: "true",
      MICROSOFT_SYNC_MODE: "central_calendar",
      MICROSOFT_TENANT_ID: "tenant",
      MICROSOFT_CLIENT_ID: "client",
      MICROSOFT_CLIENT_SECRET: "secret",
      MICROSOFT_DEFAULT_CALENDAR_ID: "calendar",
    });

    expect(config.isConfigured).toBe(true);
    expect(config.graphBaseUrl).toBe("https://graph.microsoft.com/v1.0");
  });

  it("normalizes unsupported modes to disabled", () => {
    expect(parseMicrosoftCalendarSyncMode("central_calendar")).toBe(
      "central_calendar",
    );
    expect(parseMicrosoftCalendarSyncMode("facility_calendars")).toBe(
      "facility_calendars",
    );
    expect(parseMicrosoftCalendarSyncMode("personal")).toBe("disabled");
  });
});
