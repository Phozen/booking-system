import { describe, expect, it } from "vitest";

import { getSafeInternalPath } from "@/lib/auth/session";

describe("safe internal next paths", () => {
  it("accepts internal booking and calendar paths", () => {
    expect(getSafeInternalPath("/bookings/abc?calendar=unavailable")).toBe(
      "/bookings/abc?calendar=unavailable",
    );
  });

  it("rejects external, protocol-relative, and backslash redirect attempts", () => {
    expect(getSafeInternalPath("https://evil.example")).toBeNull();
    expect(getSafeInternalPath("//evil.example")).toBeNull();
    expect(getSafeInternalPath("/%5Cevil.example")).toBeNull();
  });
});
