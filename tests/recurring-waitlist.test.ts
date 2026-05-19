import { describe, expect, it } from "vitest";

import { generateRecurrenceOccurrences } from "@/lib/bookings/recurring/occurrences";
import { waitlistRequestSchema } from "@/lib/waitlist/validation";
import { formatWaitlistStatus } from "@/lib/waitlist/format";

describe("recurrence occurrence generation", () => {
  it("generates weekly occurrences up to the requested count", () => {
    const occurrences = generateRecurrenceOccurrences({
      startsOn: "2026-06-01",
      frequency: "weekly",
      intervalCount: 1,
      occurrenceCount: 3,
    });

    expect(occurrences).toEqual([
      { sequence: 1, date: "2026-06-01" },
      { sequence: 2, date: "2026-06-08" },
      { sequence: 3, date: "2026-06-15" },
    ]);
  });

  it("clamps monthly recurrences to valid month days", () => {
    const occurrences = generateRecurrenceOccurrences({
      startsOn: "2026-01-31",
      frequency: "monthly",
      intervalCount: 1,
      occurrenceCount: 2,
    });

    expect(occurrences[1]).toEqual({ sequence: 2, date: "2026-02-28" });
  });

  it("caps generated occurrences", () => {
    const occurrences = generateRecurrenceOccurrences({
      startsOn: "2026-06-01",
      frequency: "daily",
      intervalCount: 1,
      occurrenceCount: 100,
      maxOccurrences: 50,
    });

    expect(occurrences).toHaveLength(50);
  });
});

describe("waitlist validation and labels", () => {
  it("requires a purpose and valid time range inputs", () => {
    const parsed = waitlistRequestSchema.safeParse({
      facilityId: "",
      date: "2026-06-01",
      startTime: "09:00",
      endTime: "10:00",
      attendeeCount: "8",
      title: "",
      reason: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("formats alternative status clearly", () => {
    expect(formatWaitlistStatus("suggested_alternative")).toBe(
      "Alternative suggested",
    );
  });
});
