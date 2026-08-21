import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const equipmentSource = readFileSync(
  join(process.cwd(), "components/admin/equipment/equipment-item-manager.tsx"),
  "utf8",
);

describe("equipment archive confirmation", () => {
  it("asks before archiving and leaves reactivate as a direct action", () => {
    expect(equipmentSource).toContain('title="Archive this item?"');
    expect(equipmentSource).toContain('confirmLabel="Archive"');
    expect(equipmentSource).toContain('cancelLabel="Keep equipment"');
    expect(equipmentSource).toContain('triggerLabel="Archive"');
    expect(equipmentSource).toContain("Reactivate");
    expect(equipmentSource).not.toContain('title="Reactivate');
  });
});
