import { describe, expect, it } from "vitest";

import {
  bookingFormSchema,
  getBookingDateRange,
  normalizeAttendeeCount,
} from "@/lib/bookings/validation";

describe("booking validation", () => {
  it("accepts a valid booking request", () => {
    const parsed = bookingFormSchema.safeParse({
      facilityId: "11111111-1111-4111-8111-111111111111",
      date: "2026-06-01",
      startTime: "10:00",
      endTime: "11:00",
      title: "Planning meeting",
      description: "",
      attendeeCount: "8",
      cateringRequired: "no",
      cateringType: "",
      cateringPax: "",
      cateringServingTime: "",
      cateringDietaryNotes: "",
      cateringNotes: "",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.attendeeCount).toBe(8);
    }
  });

  it("rejects invalid time inputs and negative attendee counts", () => {
    const parsed = bookingFormSchema.safeParse({
      facilityId: "11111111-1111-4111-8111-111111111111",
      date: "2026-06-01",
      startTime: "24:00",
      endTime: "11:00",
      title: "A",
      attendeeCount: "-1",
      cateringRequired: "no",
      cateringType: "",
      cateringPax: "",
      cateringServingTime: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires catering type, pax, and serving time when catering is requested", () => {
    const missing = bookingFormSchema.safeParse({
      facilityId: "11111111-1111-4111-8111-111111111111",
      date: "2026-06-01",
      startTime: "10:00",
      endTime: "11:00",
      title: "Management meeting",
      attendeeCount: "8",
      cateringRequired: "yes",
      cateringType: "",
      cateringPax: "",
      cateringServingTime: "",
      cateringDietaryNotes: "",
      cateringNotes: "",
    });

    expect(missing.success).toBe(false);

    const valid = bookingFormSchema.safeParse({
      facilityId: "11111111-1111-4111-8111-111111111111",
      date: "2026-06-01",
      startTime: "10:00",
      endTime: "11:00",
      title: "Management meeting",
      attendeeCount: "8",
      cateringRequired: "yes",
      cateringType: "vip_catering",
      cateringPax: "8",
      cateringServingTime: "before_meeting",
      cateringDietaryNotes: "Halal",
      cateringNotes: "Serve before arrival",
    });

    expect(valid.success).toBe(true);
  });

  it("builds Malaysia-time UTC ranges and blocks reversed ranges", () => {
    const validRange = getBookingDateRange({
      date: "2026-06-01",
      startTime: "10:00",
      endTime: "11:00",
    });

    expect(validRange.message).toBeNull();
    expect(validRange.startsAt?.toISOString()).toBe("2026-06-01T02:00:00.000Z");
    expect(validRange.endsAt?.toISOString()).toBe("2026-06-01T03:00:00.000Z");

    const invalidRange = getBookingDateRange({
      date: "2026-06-01",
      startTime: "11:00",
      endTime: "10:00",
    });

    expect(invalidRange.message).toBe("Start time must be before end time.");
  });

  it("normalizes optional attendee counts", () => {
    expect(normalizeAttendeeCount("")).toBeNull();
    expect(normalizeAttendeeCount(undefined)).toBeNull();
    expect(normalizeAttendeeCount(0)).toBe(0);
  });
});
