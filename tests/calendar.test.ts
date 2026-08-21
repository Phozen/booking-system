import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  doesDateRangeOverlap,
  formatCalendarDateKey,
  getCalendarMonthDays,
  getCalendarMonthRange,
  parseCalendarMonth,
} from "@/lib/calendar/date-range";
import { groupCalendarBookingsByDay } from "@/lib/calendar/group-bookings";
import { getCalendarDaySelectLabel } from "@/lib/calendar/selection";

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

  it("returns only selected-month days for the month grid", () => {
    const days = getCalendarMonthDays(
      parseCalendarMonth("2026-05", appTimeZone),
      appTimeZone,
    );

    expect(days).toHaveLength(31);
    expect(days[0]).toMatchObject({
      key: "2026-05-01",
      dateNumber: 1,
      weekdayIndex: 5,
      isCurrentMonth: true,
    });
    expect(days.at(-1)).toMatchObject({
      key: "2026-05-31",
      dateNumber: 31,
      weekdayIndex: 0,
      isCurrentMonth: true,
    });
    expect(days.some((day) => day.key === "2026-06-01")).toBe(false);
  });

  it("handles leap-year February without adjacent-month dates", () => {
    const days = getCalendarMonthDays(
      parseCalendarMonth("2024-02", appTimeZone),
      appTimeZone,
    );

    expect(days).toHaveLength(29);
    expect(days[0].key).toBe("2024-02-01");
    expect(days.at(-1)?.key).toBe("2024-02-29");
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

describe("calendar day selection labels", () => {
  it("labels empty days so they stay selectable", () => {
    expect(
      getCalendarDaySelectLabel(
        { weekdayLabel: "Friday", shortLabel: "Fri, 21 Aug" },
        0,
      ),
    ).toBe("Select Friday, Fri, 21 Aug, no bookings");
  });

  it("includes the booking count for occupied days", () => {
    expect(
      getCalendarDaySelectLabel(
        { weekdayLabel: "Friday", shortLabel: "Fri, 21 Aug" },
        1,
      ),
    ).toBe("Select Friday, Fri, 21 Aug, 1 booking");
    expect(
      getCalendarDaySelectLabel(
        { weekdayLabel: "Friday", shortLabel: "Fri, 21 Aug" },
        2,
      ),
    ).toBe("Select Friday, Fri, 21 Aug, 2 bookings");
  });
});

describe("mobile calendar empty-day selection", () => {
  const monthGridSource = readFileSync(
    join(process.cwd(), "components/calendar/month-calendar-grid.tsx"),
    "utf8",
  ).replace(/\s+/g, " ");
  const dayPanelSource = readFileSync(
    join(process.cwd(), "components/calendar/calendar-day-detail-panel.tsx"),
    "utf8",
  ).replace(/\s+/g, " ");

  it("keeps the month grid tappable on phones without booking titles in cells", () => {
    expect(monthGridSource).not.toContain(
      'className="hidden overflow-hidden rounded-lg border border-border bg-card md:block"',
    );
    expect(monthGridSource).toContain("min-h-11");
    expect(monthGridSource).toContain("hidden gap-0.5 md:grid");
    expect(monthGridSource).toContain("getCalendarDaySelectLabel(day, bookings.length)");
  });

  it("shows the selected-day panel on phones so empty days can be booked", () => {
    expect(dayPanelSource).not.toContain("hidden gap-4 self-start");
    expect(dayPanelSource).toContain("No bookings on this day");
    expect(dayPanelSource).toContain("Book this day");
  });
});

describe("employee calendar primary action", () => {
  const controlsSource = readFileSync(
    join(process.cwd(), "components/calendar/calendar-controls.tsx"),
    "utf8",
  );
  const dayPanelSource = readFileSync(
    join(process.cwd(), "components/calendar/calendar-day-detail-panel.tsx"),
    "utf8",
  );

  it("keeps Book this day filled and makes compact Apply outline", () => {
    expect(controlsSource).toContain(
      'buttonVariants({ variant: "outline", size: "sm" })',
    );
    expect(controlsSource).toContain(
      'buttonVariants({ size: "sm", className: "w-full md:w-auto" })',
    );
    expect(dayPanelSource).toContain(
      'buttonVariants({ size: "sm", className: "shrink-0" })',
    );
    expect(dayPanelSource).toContain("buttonVariants()");
  });
});
