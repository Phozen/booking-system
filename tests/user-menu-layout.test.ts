import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("user menu layout", () => {
  it("keeps account controls in a row, separate from the side switch", () => {
    const source = readFileSync(
      join(process.cwd(), "components/shared/user-menu.tsx"),
      "utf8",
    );

    expect(source).toContain(
      '"flex flex-row flex-wrap items-center gap-2 sm:justify-end"',
    );
    expect(source).not.toContain("flex flex-col gap-2 sm:flex-row");
    expect(source.indexOf("switchLabel")).toBeLessThan(
      source.indexOf("aria-label=\"Profile\""),
    );
  });
});
