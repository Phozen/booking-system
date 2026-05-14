import { describe, expect, it } from "vitest";

import {
  baseDefaultAppSettings,
  formatAccountInactiveMessage,
  formatAllowedEmailDomains,
  formatEffectiveApprovalCopy,
  formatEffectiveApprovalLabel,
  formatRegistrationDisabledMessage,
  getCompanyDisplayName,
  mapSettingsRowsToAppSettings,
} from "@/lib/settings/app-settings";

describe("app settings helpers", () => {
  it("uses safe defaults when settings rows are missing or malformed", () => {
    const settings = mapSettingsRowsToAppSettings([
      { key: "app_name", value: "" },
      { key: "registration_enabled", value: "yes" },
      { key: "default_timezone", value: "" },
    ]);

    expect(settings.appName).toBe(baseDefaultAppSettings.appName);
    expect(settings.registrationEnabled).toBe(true);
    expect(settings.calendarVisibilityMode).toBe("my_bookings_only");
    expect(settings.defaultTimezone).toBe("Asia/Kuala_Lumpur");
  });

  it("normalizes public identity and domain settings", () => {
    const settings = mapSettingsRowsToAppSettings([
      { key: "app_name", value: "  Room Hub  " },
      { key: "company_name", value: "  Example Co  " },
      { key: "system_contact_email", value: " facilities@example.com " },
      { key: "allowed_email_domains", value: ["@Example.com", "team.example.com"] },
      { key: "calendar_visibility_mode", value: "all_company_bookings" },
    ]);

    expect(settings.appName).toBe("Room Hub");
    expect(getCompanyDisplayName(settings)).toBe("Example Co");
    expect(settings.systemContactEmail).toBe("facilities@example.com");
    expect(settings.calendarVisibilityMode).toBe("all_company_bookings");
    expect(formatAllowedEmailDomains(settings.allowedEmailDomains)).toBe(
      "example.com, team.example.com",
    );
  });

  it("formats contact-aware access and registration messages", () => {
    const settings = {
      systemContactEmail: "facilities@example.com",
    };

    expect(formatRegistrationDisabledMessage(settings)).toContain(
      "Contact facilities@example.com for help.",
    );
    expect(formatAccountInactiveMessage(settings)).toContain(
      "Contact facilities@example.com for help.",
    );
  });

  it("resolves approval copy from global and facility override settings", () => {
    const settings = {
      defaultApprovalRequired: true,
      allowFacilityApprovalOverride: false,
    };

    expect(formatEffectiveApprovalLabel(false, settings)).toBe(
      "Approval required",
    );
    expect(formatEffectiveApprovalCopy(false, settings)).toContain(
      "System settings require admin approval",
    );

    expect(
      formatEffectiveApprovalLabel(false, {
        ...settings,
        allowFacilityApprovalOverride: true,
      }),
    ).toBe("No approval required");
  });
});
