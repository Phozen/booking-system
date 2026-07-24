import { describe, expect, it } from "vitest";

import { parseDepartmentFilters } from "@/lib/admin/departments/validation";

describe("admin department management validation", () => {
  it("parses a department directory search and status filter", () => {
    expect(
      parseDepartmentFilters({
        search: "  Operations  ",
        status: "inactive",
      }),
    ).toEqual({ search: "Operations", status: "inactive" });
  });

  it("ignores the all status sentinel and invalid filters", () => {
    expect(parseDepartmentFilters({ status: "all" })).toEqual({});
    expect(parseDepartmentFilters({ status: "unknown" })).toEqual({});
  });
});
