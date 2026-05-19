import { describe, expect, it } from "vitest";

import {
  formatAppRole,
  getDashboardPathForRole,
  isAdminRole,
  isSuperAdminRole,
} from "@/lib/auth/profile";
import { getMissingProfileFields } from "@/lib/profile/completion";

describe("auth profile role helpers", () => {
  it("treats admin and super admin as admin-level roles", () => {
    expect(isAdminRole("employee")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("super_admin")).toBe(true);
  });

  it("identifies super admins separately", () => {
    expect(isSuperAdminRole("admin")).toBe(false);
    expect(isSuperAdminRole("super_admin")).toBe(true);
  });

  it("routes admin-level users to the admin dashboard", () => {
    expect(getDashboardPathForRole("employee")).toBe("/dashboard");
    expect(getDashboardPathForRole("admin")).toBe("/admin/dashboard");
    expect(getDashboardPathForRole("super_admin")).toBe("/admin/dashboard");
  });

  it("formats role labels", () => {
    expect(formatAppRole("employee")).toBe("Employee");
    expect(formatAppRole("admin")).toBe("Admin");
    expect(formatAppRole("super_admin")).toBe("Super Admin");
  });

  it("detects missing profile completion fields", () => {
    expect(
      getMissingProfileFields({
        full_name: "Jane User",
        department: "Operations",
        phone: "+60123456789",
      }),
    ).toEqual({
      isComplete: true,
      missingFields: [],
    });

    expect(
      getMissingProfileFields({
        full_name: " ",
        department: null,
        phone: "",
      }),
    ).toEqual({
      isComplete: false,
      missingFields: ["Full name", "Department", "Phone"],
    });
  });
});
