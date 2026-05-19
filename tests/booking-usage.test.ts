import { describe, expect, it } from "vitest";

import {
  canTrackBookingUsage,
  formatBookingUsageStatus,
} from "@/lib/bookings/usage";

describe("booking usage helpers", () => {
  it("formats usage labels", () => {
    expect(formatBookingUsageStatus("not_tracked")).toBe("Not tracked");
    expect(formatBookingUsageStatus("checked_in")).toBe("Checked in");
    expect(formatBookingUsageStatus("no_show")).toBe("No-show");
  });

  it("allows tracking for confirmed and historical bookings only", () => {
    expect(canTrackBookingUsage("confirmed")).toBe(true);
    expect(canTrackBookingUsage("completed")).toBe(true);
    expect(canTrackBookingUsage("expired")).toBe(true);
    expect(canTrackBookingUsage("pending")).toBe(false);
    expect(canTrackBookingUsage("cancelled")).toBe(false);
    expect(canTrackBookingUsage("rejected")).toBe(false);
  });
});
