import { describe, expect, it } from "vitest";

import { getFirstInvalidFieldName } from "@/lib/forms/invalid-field-focus";

describe("getFirstInvalidFieldName", () => {
  it("returns the first field with a non-empty error", () => {
    expect(
      getFirstInvalidFieldName({
        facilityId: "Choose a room to continue.",
        date: "Choose a date.",
      }),
    ).toBe("facilityId");
  });

  it("skips blank and empty errors", () => {
    expect(
      getFirstInvalidFieldName({
        facilityId: "   ",
        date: undefined,
        startTime: "Choose a start time.",
      }),
    ).toBe("startTime");
  });

  it("returns undefined when every field is valid", () => {
    expect(
      getFirstInvalidFieldName({
        facilityId: null,
        date: "",
      }),
    ).toBeUndefined();
  });
});
