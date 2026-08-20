import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { toEmployeeCalendarItem } from "@/lib/calendar/employee-items";
import type { EmployeeCalendarBooking } from "@/lib/bookings/calendar-queries";

const employeeCalendarPage = readFileSync(
  join(process.cwd(), "app/(app)/calendar/page.tsx"),
  "utf8",
);

function makeBooking(
  overrides: Partial<EmployeeCalendarBooking> = {},
): EmployeeCalendarBooking {
  return {
    id: "booking-1",
    facilityId: "facility-1",
    userId: "user-1",
    title: "Secret planning session",
    status: "confirmed",
    startsAt: "2026-05-01T02:00:00.000Z",
    endsAt: "2026-05-01T03:00:00.000Z",
    approvalRequired: true,
    facility: {
      id: "facility-1",
      name: "Meeting Room 1",
      level: "Level 5",
      type: "meeting_room",
    },
    user: {
      id: "user-2",
      email: "owner@qbook.test",
      fullName: "Alex Owner",
    },
    ...overrides,
  };
}

describe("employee calendar all-bookings mapping", () => {
  it("keeps owned bookings linked with full titles", () => {
    const item = toEmployeeCalendarItem(
      makeBooking({ visibilityContext: "owned", userId: "user-1" }),
    );

    expect(item.href).toBe("/bookings/booking-1");
    expect(item.title).toBe("Secret planning session");
    expect(item.isManageable).toBe(true);
    expect(item.relationship).toBe("owned");
  });

  it("keeps invited bookings linked", () => {
    const item = toEmployeeCalendarItem(
      makeBooking({
        visibilityContext: "invited",
        invitationStatus: "accepted",
      }),
    );

    expect(item.href).toBe("/bookings/booking-1");
    expect(item.relationship).toBe("invited");
    expect(item.contextLabel).toBe("Accepted invitation");
  });

  it("limits unrelated company bookings and does not link to detail", () => {
    const item = toEmployeeCalendarItem(
      makeBooking({ visibilityContext: "other" }),
    );

    expect(item.href).toBeUndefined();
    expect(item.title).toBe("Booked");
    expect(item.isManageable).toBe(false);
    expect(item.approvalRequired).toBeUndefined();
    expect(item.userLabel).toBe("Alex Owner");
    expect(item.userLabel).not.toContain("@");
    expect(item.facilityName).toBe("Meeting Room 1");
    expect(item.relationship).toBe("other");
  });
});

describe("employee calendar page wiring", () => {
  it("loads company bookings only through the visibility-gated all view", () => {
    expect(employeeCalendarPage).toContain("canViewAllCalendarBookings");
    expect(employeeCalendarPage).toContain("getCompanyCalendarBookings");
    expect(employeeCalendarPage).toContain("showViewToggle={allowAll}");
    expect(employeeCalendarPage).toContain("adminSupabase");
    expect(employeeCalendarPage).toContain('selectedView === "all" && allowAll');
  });
});
