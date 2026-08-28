import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("mobile navigation panel", () => {
  it("uses a fixed-width overlay instead of the menu button width", () => {
    const source = readFileSync(
      join(process.cwd(), "components/shared/mobile-nav.tsx"),
      "utf8",
    );

    expect(source).toContain("createPortal");
    expect(source).toContain("document.body");
    expect(source).toContain("w-[min(22rem,calc(100svw-2rem))]");
    expect(source).toContain("max-w-[calc(100svw-2rem)]");
    expect(source).toContain("end-4 start-auto");
    expect(source).not.toContain("absolute inset-x-4");
    expect(source).not.toContain("origin-top-right");
  });

  it("keeps profile, notifications, logout, and theme controls in a row", () => {
    const source = readFileSync(
      join(process.cwd(), "components/shared/mobile-nav.tsx"),
      "utf8",
    );

    expect(source).toContain(
      'controlsClassName="flex-row flex-wrap items-center justify-start"',
    );
    expect(source).not.toContain("flex flex-col gap-2 sm:flex-row");
  });
});
