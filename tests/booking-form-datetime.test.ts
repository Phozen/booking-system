import { describe, expect, it } from "vitest";

import { getZonedBookingFormDateTime } from "@/lib/bookings/form-datetime";

describe("booking form date time helper", () => {
  it("formats UTC timestamps for the configured timezone", () => {
    expect(
      getZonedBookingFormDateTime("2026-05-19T02:30:00.000Z", "Asia/Kuala_Lumpur"),
    ).toEqual({
      date: "2026-05-19",
      time: "10:30",
    });
  });

  it("returns empty fields for invalid timestamps", () => {
    expect(getZonedBookingFormDateTime("not-a-date")).toEqual({
      date: "",
      time: "",
    });
  });
});
