import { describe, expect, it } from "vitest";

import {
  canViewAllCalendarBookings,
  canUseAllCompanyCalendar,
  getCalendarVisibilityLabel,
  parseCalendarViewMode,
  parseCalendarVisibilityMode,
  shouldShowAllBookingsToggle,
} from "@/lib/calendar/visibility";

describe("calendar visibility helpers", () => {
  it("defaults malformed visibility settings to my bookings only", () => {
    expect(parseCalendarVisibilityMode("all_company_bookings")).toBe("all_users");
    expect(parseCalendarVisibilityMode("admins_only")).toBe("admins_only");
    expect(parseCalendarVisibilityMode("all_users")).toBe("all_users");
    expect(parseCalendarVisibilityMode("anything_else")).toBe(
      "my_bookings_only",
    );
  });

  it("enforces all-bookings access by role and visibility mode", () => {
    expect(canViewAllCalendarBookings("employee", "my_bookings_only")).toBe(false);
    expect(canViewAllCalendarBookings("admin", "my_bookings_only")).toBe(false);
    expect(canViewAllCalendarBookings("super_admin", "my_bookings_only")).toBe(
      false,
    );

    expect(canViewAllCalendarBookings("employee", "admins_only")).toBe(false);
    expect(canViewAllCalendarBookings("admin", "admins_only")).toBe(true);
    expect(canViewAllCalendarBookings("super_admin", "admins_only")).toBe(true);

    expect(canViewAllCalendarBookings("employee", "all_users")).toBe(true);
    expect(canViewAllCalendarBookings("admin", "all_users")).toBe(true);
    expect(canViewAllCalendarBookings("super_admin", "all_users")).toBe(true);
  });

  it("keeps the legacy all-company helper mapped to the new scope rules", () => {
    expect(canUseAllCompanyCalendar("my_bookings_only")).toBe(false);
    expect(canUseAllCompanyCalendar("my_bookings_only", true)).toBe(false);
    expect(canUseAllCompanyCalendar("admins_only", true)).toBe(true);
    expect(canUseAllCompanyCalendar("all_users")).toBe(true);
  });

  it("uses the same helper for toggle visibility", () => {
    expect(shouldShowAllBookingsToggle("employee", "admins_only")).toBe(false);
    expect(shouldShowAllBookingsToggle("employee", "all_users")).toBe(true);
    expect(shouldShowAllBookingsToggle("admin", "admins_only")).toBe(true);
    expect(shouldShowAllBookingsToggle("super_admin", "all_users")).toBe(true);
  });

  it("formats setting labels", () => {
    expect(getCalendarVisibilityLabel("my_bookings_only")).toBe(
      "My bookings only",
    );
    expect(getCalendarVisibilityLabel("admins_only")).toBe("Admins only");
    expect(getCalendarVisibilityLabel("all_users")).toBe("All users");
  });

  it("falls back to my bookings when all bookings are not allowed", () => {
    expect(
      parseCalendarViewMode({
        value: "all",
        allowAll: false,
      }),
    ).toBe("my");

    expect(
      parseCalendarViewMode({
        value: "all",
        allowAll: true,
      }),
    ).toBe("all");
  });
});
