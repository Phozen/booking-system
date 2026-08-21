import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildFacilitySlug } from "@/lib/facilities/format";
import { facilityFormSchema } from "@/lib/facilities/validation";

const validFacility = {
  code: "MR-L9-01",
  name: "Meeting Room 9",
  level: "Level 9",
  type: "meeting_room",
  capacity: "12",
  description: "Quiet meeting room.",
  status: "active",
  requiresApproval: "inherit",
};

describe("facility validation", () => {
  it("accepts admin facility payloads without a slug field", () => {
    const parsed = facilityFormSchema.safeParse(validFacility);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("slug");
    }
  });

  it("builds a URL slug from the facility name", () => {
    expect(buildFacilitySlug("Event Hall", "EH-L1-01")).toBe("event-hall");
    expect(buildFacilitySlug("  Meeting Room 5  ")).toBe("meeting-room-5");
    expect(buildFacilitySlug("???", "EH-L1-01")).toBe("eh-l1-01");
  });
});

describe("admin facility edit UI", () => {
  it("does not show a slug field", () => {
    const source = readFileSync(
      join(process.cwd(), "components/admin/facilities/facility-form.tsx"),
      "utf8",
    );

    expect(source).not.toContain('htmlFor="slug"');
    expect(source).not.toContain('name="slug"');
  });

  it("keeps facility equipment to a compact checkbox and quantity grid", () => {
    const source = readFileSync(
      join(process.cwd(), "components/admin/facilities/facility-equipment-manager.tsx"),
      "utf8",
    );

    expect(source).toContain('name="equipmentId"');
    expect(source).toContain("Qty");
    expect(source).not.toContain('name={`notes-${item.id}`}');
    expect(source).not.toContain("No description.");
    expect(source).toContain("grid-cols-2");
  });

  it("does not load an availability timeline on the admin edit page", () => {
    const source = readFileSync(
      join(process.cwd(), "app/admin/facilities/[id]/page.tsx"),
      "utf8",
    );

    expect(source).not.toContain("FacilityAvailabilityTimeline");
    expect(source).not.toContain("getFacilityAvailabilityTimeline");
  });
});
