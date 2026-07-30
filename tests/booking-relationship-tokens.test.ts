import { describe, expect, it } from "vitest";

import {
  bookingRelationshipTokens,
  getBookingRelationshipBadgeClassName,
  getBookingRelationshipSurfaceClassName,
  getBookingRelationshipSwatchClassName,
  getBookingRelationshipToken,
} from "@/components/shared/booking-relationship-tokens";

describe("booking relationship tokens", () => {
  it("labels owned and invited distinctly", () => {
    expect(getBookingRelationshipToken("owned").shortLabel).toBe("Yours");
    expect(getBookingRelationshipToken("invited").shortLabel).toBe("Invited");
    expect(bookingRelationshipTokens.owned.label).toBe("Your booking");
  });

  it("returns distinct surface classes for owned vs invited", () => {
    const owned = getBookingRelationshipSurfaceClassName("owned");
    const invited = getBookingRelationshipSurfaceClassName("invited");

    expect(owned).toContain("bg-primary");
    expect(invited).toContain("bg-sky");
    expect(owned).not.toBe(invited);
  });

  it("returns badge and swatch helpers for both relationships", () => {
    expect(getBookingRelationshipBadgeClassName("owned")).toContain("primary");
    expect(getBookingRelationshipBadgeClassName("invited")).toContain("sky");
    expect(getBookingRelationshipSwatchClassName("owned")).toContain("bg-primary");
    expect(getBookingRelationshipSwatchClassName("invited")).toContain("bg-sky");
  });
});
