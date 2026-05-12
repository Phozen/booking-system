import { describe, expect, it } from "vitest";

import {
  canUseAllCompanyCalendar,
  parseCalendarViewMode,
  parseCalendarVisibilityMode,
} from "@/lib/calendar/visibility";

describe("calendar visibility helpers", () => {
  it("defaults malformed visibility settings to my bookings only", () => {
    expect(parseCalendarVisibilityMode("all_company_bookings")).toBe(
      "all_company_bookings",
    );
    expect(parseCalendarVisibilityMode("anything_else")).toBe(
      "my_bookings_only",
    );
  });

  it("allows admins to use all-company calendar regardless of employee setting", () => {
    expect(canUseAllCompanyCalendar("my_bookings_only")).toBe(false);
    expect(canUseAllCompanyCalendar("my_bookings_only", true)).toBe(true);
    expect(canUseAllCompanyCalendar("all_company_bookings")).toBe(true);
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
