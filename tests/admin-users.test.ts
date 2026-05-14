import { describe, expect, it } from "vitest";

import {
  isSelfRoleOrStatusChange,
  parseUserFilters,
  removesActiveAdminAccess,
  userEditSchema,
} from "@/lib/admin/users/validation";

describe("admin user management validation", () => {
  it("parses search, role, and status filters", () => {
    expect(
      parseUserFilters({
        search: "  jane@example.com  ",
        role: "super_admin",
        status: "active",
      }),
    ).toEqual({
      search: "jane@example.com",
      role: "super_admin",
      status: "active",
    });
  });

  it("ignores all filter sentinels", () => {
    expect(parseUserFilters({ role: "all", status: "all" })).toEqual({});
  });

  it("validates editable profile fields and access controls", () => {
    const parsed = userEditSchema.safeParse({
      userId: "11111111-1111-4111-8111-111111111111",
      fullName: "Jane Employee",
      department: "Operations",
      phone: "+60 12 345 6789",
      role: "super_admin",
      status: "active",
    });

    expect(parsed.success).toBe(true);
  });

  it("detects self role or status changes", () => {
    expect(
      isSelfRoleOrStatusChange({
        actorUserId: "user-1",
        targetUserId: "user-1",
        existingRole: "super_admin",
        existingStatus: "active",
        nextRole: "employee",
        nextStatus: "active",
      }),
    ).toBe(true);

    expect(
      isSelfRoleOrStatusChange({
        actorUserId: "user-1",
        targetUserId: "user-2",
        existingRole: "super_admin",
        existingStatus: "active",
        nextRole: "employee",
        nextStatus: "disabled",
      }),
    ).toBe(false);
  });

  it("detects changes that remove active super admin access", () => {
    expect(
      removesActiveAdminAccess({
        existingRole: "super_admin",
        existingStatus: "active",
        nextRole: "employee",
        nextStatus: "active",
      }),
    ).toBe(true);

    expect(
      removesActiveAdminAccess({
        existingRole: "super_admin",
        existingStatus: "active",
        nextRole: "admin",
        nextStatus: "disabled",
      }),
    ).toBe(true);

    expect(
      removesActiveAdminAccess({
        existingRole: "admin",
        existingStatus: "active",
        nextRole: "employee",
        nextStatus: "disabled",
      }),
    ).toBe(false);
  });
});
