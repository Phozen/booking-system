import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  join(process.cwd(), "app/admin/users/[id]/page.tsx"),
  "utf8",
);
const formSource = readFileSync(
  join(process.cwd(), "components/admin/users/user-edit-form.tsx"),
  "utf8",
);

describe("last Super Admin access lock", () => {
  it("counts other active Super Admins and locks role and status in the edit form", () => {
    expect(pageSource).toContain("countOtherActiveSuperAdmins");
    expect(pageSource).toContain("isLastActiveSuperAdmin={isLastActiveSuperAdmin(");
    expect(formSource).toContain("lockAccessControls = isSelf || isLastActiveSuperAdmin");
    expect(formSource).toContain("disabled={lockAccessControls}");
    expect(formSource).toContain(
      "This is the last active Super Admin. Role and status stay locked so the system always has one Super Admin.",
    );
  });
});
