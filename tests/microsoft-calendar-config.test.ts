import { describe, expect, it } from "vitest";

import {
  getMicrosoftCalendarSyncConfig,
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
