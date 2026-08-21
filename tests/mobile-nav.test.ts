import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("mobile navigation panel", () => {
  it("uses a fixed-width overlay instead of the menu button width", () => {
    const source = readFileSync(
      join(process.cwd(), "components/shared/mobile-nav.tsx"),
      "utf8",
    );

    expect(source).toContain("fixed end-4");
    expect(source).toContain("w-[min(22rem,calc(100vw-2rem))]");
    expect(source).not.toContain("absolute inset-x-4");
  });
});
