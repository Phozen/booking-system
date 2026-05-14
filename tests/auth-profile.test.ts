import { describe, expect, it } from "vitest";

import {
  formatAppRole,
  getDashboardPathForRole,
  isAdminRole,
  isSuperAdminRole,
} from "@/lib/auth/profile";

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
});
