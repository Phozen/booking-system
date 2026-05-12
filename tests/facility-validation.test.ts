import { describe, expect, it } from "vitest";

import { facilityFormSchema } from "@/lib/facilities/validation";

describe("facility validation", () => {
  it("accepts admin facility payloads without display order", () => {
    const parsed = facilityFormSchema.safeParse({
      code: "MR-L9-01",
      name: "Meeting Room 9",
      slug: "meeting-room-9",
      level: "Level 9",
      type: "meeting_room",
      capacity: "12",
      description: "Quiet meeting room.",
      status: "active",
      requiresApproval: "inherit",
    });

    expect(parsed.success).toBe(true);
  });
});
