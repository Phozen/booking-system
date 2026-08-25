import { describe, expect, it } from "vitest";

import {
  baseDefaultAppSettings,
  mapSettingsRowsToAppSettings,
  settingKeyMap,
} from "@/lib/settings/app-settings";

describe("email recipient settings", () => {
  it("keeps the established direct-confirmation and catering recipients by default", () => {
    expect(baseDefaultAppSettings.emailRecipients).toEqual({
      bookingOwnerConfirmations: ["employee", "admin", "super_admin"],
      companyBookingConfirmations: [],
      cateringRequests: ["admin", "super_admin"],
      pendingApprovals: ["admin", "super_admin"],
    });
  });

  it("loads each email audience independently from system settings", () => {
    const settings = mapSettingsRowsToAppSettings([
      {
        key: settingKeyMap.emailRecipients,
        value: {
          bookingOwnerConfirmations: ["employee"],
          companyBookingConfirmations: ["super_admin"],
          cateringRequests: ["admin", "super_admin"],
          pendingApprovals: ["admin"],
        },
      },
    ]);

    expect(settings.emailRecipients).toEqual({
      bookingOwnerConfirmations: ["employee"],
      companyBookingConfirmations: ["super_admin"],
      cateringRequests: ["admin", "super_admin"],
      pendingApprovals: ["admin"],
    });
  });

  it("falls back to default pending approval recipients when missing from stored settings", () => {
    const settings = mapSettingsRowsToAppSettings([
      {
        key: settingKeyMap.emailRecipients,
        value: {
          bookingOwnerConfirmations: ["employee"],
          companyBookingConfirmations: [],
          cateringRequests: ["admin"],
        },
      },
    ]);

    expect(settings.emailRecipients.pendingApprovals).toEqual([
      "admin",
      "super_admin",
    ]);
  });
});
