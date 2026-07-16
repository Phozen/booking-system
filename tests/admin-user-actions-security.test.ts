import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
  getAdminUserById: vi.fn(),
  createAuditLogSafely: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/audit/log", () => ({
  createAuditLogSafely: mocks.createAuditLogSafely,
}));

vi.mock("@/lib/admin/users/queries", () => ({
  getAdminUserById: mocks.getAdminUserById,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  provisionApprovedUserAction,
  updateUserProfileAction,
} from "@/lib/admin/users/actions";

const initialState = { status: "idle" as const, message: "" };

describe("approved-user action authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["provision", provisionApprovedUserAction],
    ["role/status mutation", updateUserProfileAction],
  ])("rejects a direct Admin-level %s call", async (_name, action) => {
    mocks.requireSuperAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT: super-admin required"),
    );

    await expect(action(initialState, new FormData())).rejects.toThrow(
      /super-admin required/,
    );
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("keeps an authoritative deactivation successful when profile display sync fails", async () => {
    mocks.requireSuperAdmin.mockResolvedValue({
      user: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        email: "super.admin@example.com",
      },
    });
    mocks.getAdminUserById.mockResolvedValue({
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      authUserId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      email: "employee@example.com",
      fullName: "Employee",
      department: null,
      phone: null,
      role: "employee",
      status: "active",
    });

    const rpc = vi.fn().mockResolvedValue({ data: {}, error: null });
    mocks.createClient.mockResolvedValue({ rpc });
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "profiles") throw new Error(`Unexpected table ${table}`);
        return {
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              error: { code: "XX000", message: "profile sync unavailable" },
            }),
          })),
        };
      }),
    });

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const formData = new FormData();
    formData.set("userId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    formData.set("fullName", "Employee");
    formData.set("department", "");
    formData.set("phone", "");
    formData.set("role", "employee");
    formData.set("status", "disabled");

    const result = await updateUserProfileAction(initialState, formData);

    expect(rpc).toHaveBeenCalledWith("update_approved_user_access", {
      p_approved_user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      p_role: "employee",
      p_status: "disabled",
    });
    expect(result.status).toBe("success");
    expect(consoleError).toHaveBeenCalledWith(
      "Linked profile sync failed",
      expect.objectContaining({ code: "XX000" }),
    );
    consoleError.mockRestore();
  });
});
