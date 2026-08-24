import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("admin audit logs UI", () => {
  it("keeps the list table to wrapped summary columns instead of a wide JSON dump", () => {
    const source = readFileSync(
      join(process.cwd(), "components/admin/audit-logs/audit-logs-table.tsx"),
      "utf8",
    );

    expect(source).toContain("table-fixed");
    expect(source).toContain("line-clamp-2");
    expect(source).not.toContain("min-w-[1280px]");
    expect(source).not.toContain("User agent");
    expect(source).not.toContain("previewJson");
  });

  it("wraps long audit detail values instead of overflowing", () => {
    const source = readFileSync(
      join(process.cwd(), "components/admin/audit-logs/audit-log-detail.tsx"),
      "utf8",
    );

    expect(source).toContain("break-all");
    expect(source).toContain("min-w-0");
    expect(source).toContain("overflow-auto");
  });
});
