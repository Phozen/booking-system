import { describe, expect, it } from "vitest";

import {
  doesDateRangeOverlap,
  formatCalendarDateKey,
  getCalendarMonthRange,
  parseCalendarMonth,
} from "@/lib/calendar/date-range";
import { groupCalendarBookingsByDay } from "@/lib/calendar/group-bookings";

const appTimeZone = "Asia/Kuala_Lumpur";

describe("calendar date ranges", () => {
  it("builds Malaysia-time UTC month boundaries", () => {
    const month = parseCalendarMonth("2026-05", appTimeZone);
    const range = getCalendarMonthRange(month, appTimeZone);

    expect(range.startsAt).toBe("2026-04-30T16:00:00.000Z");
    expect(range.endsAt).toBe("2026-05-31T16:00:00.000Z");
  });

  it("detects bookings that overlap the selected range", () => {
    const range = {
      startsAt: "2026-04-30T16:00:00.000Z",
      endsAt: "2026-05-31T16:00:00.000Z",
    };

    expect(
      doesDateRangeOverlap(
        "2026-04-30T15:00:00.000Z",
        "2026-04-30T17:00:00.000Z",
        range,
      ),
    ).toBe(true);
    expect(
      doesDateRangeOverlap(
        "2026-04-30T15:00:00.000Z",
        "2026-04-30T16:00:00.000Z",
        range,
      ),
    ).toBe(false);
    expect(
      doesDateRangeOverlap(
        "2026-05-31T16:00:00.000Z",
        "2026-05-31T17:00:00.000Z",
        range,
      ),
    ).toBe(false);
  });

  it("formats date keys in the app timezone", () => {
    expect(
      formatCalendarDateKey(new Date("2026-05-01T02:00:00.000Z"), appTimeZone),
    ).toBe("2026-05-01");
  });
});

describe("calendar grouping", () => {
  it("groups bookings by local booking date", () => {
    const grouped = groupCalendarBookingsByDay(
      [
        {
          id: "booking-1",
          href: "/bookings/booking-1",
          title: "Morning meeting",
          status: "confirmed",
          startsAt: "2026-05-01T02:00:00.000Z",
          endsAt: "2026-05-01T03:00:00.000Z",
          facilityName: "Meeting Room 1",
          facilityLevel: "Level 5",
        },
        {
          id: "booking-2",
          href: "/bookings/booking-2",
          title: "Afternoon meeting",
          status: "pending",
          startsAt: "2026-05-01T06:00:00.000Z",
          endsAt: "2026-05-01T07:00:00.000Z",
          facilityName: "Meeting Room 2",
          facilityLevel: "Level 5",
        },
      ],
      appTimeZone,
    );

    expect(grouped["2026-05-01"]).toHaveLength(2);
    expect(grouped["2026-05-01"][0].id).toBe("booking-1");
  });
});
