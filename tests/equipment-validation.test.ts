import { describe, expect, it } from "vitest";

import { equipmentFormSchema } from "@/lib/admin/equipment/validation";

describe("equipment validation", () => {
  it("accepts and trims editable equipment details", () => {
    const parsed = equipmentFormSchema.safeParse({
      name: "  Projector  ",
      description: "  Ceiling-mounted presentation projector.  ",
      iconName: "  projector  ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        name: "Projector",
        description: "Ceiling-mounted presentation projector.",
        iconName: "projector",
      });
    }
  });

  it("rejects missing names and overlong editable fields", () => {
    const parsed = equipmentFormSchema.safeParse({
      name: "   ",
      description: "a".repeat(1001),
      iconName: "i".repeat(81),
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors).toMatchObject({
        name: ["Enter an equipment name."],
        description: ["Description must be 1,000 characters or fewer."],
        iconName: ["Icon name must be 80 characters or fewer."],
      });
    }
  });
});
