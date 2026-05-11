import { describe, expect, it } from "vitest";

import {
  buildProfileUpdatePayload,
  profileUpdateSchema,
} from "@/lib/profile/validation";

describe("profile validation", () => {
  it("requires a non-empty full name", () => {
    const parsed = profileUpdateSchema.safeParse({
      fullName: "   ",
      department: "Operations",
      phone: "1234",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts safe self-editable profile fields", () => {
    const parsed = profileUpdateSchema.safeParse({
      fullName: "Ada Lovelace",
      department: "Operations",
      phone: "+60 12-345 6789",
    });

    expect(parsed.success).toBe(true);
  });

  it("sanitizes the update payload to safe profile columns only", () => {
    const payload = buildProfileUpdatePayload({
      fullName: "Ada Lovelace",
      department: "",
      phone: "",
    });

    expect(payload).toEqual({
      full_name: "Ada Lovelace",
      department: null,
      phone: null,
    });
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("email");
  });
});

