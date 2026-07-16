import { describe, expect, it, vi } from "vitest";

import { getProfileSession } from "@/lib/auth/profile";

describe("protected-request access resolution", () => {
  it("rejects an allowlisted Azure user when trusted tenant verification fails", async () => {
    const from = vi.fn();
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
      from,
    };

    const result = await getProfileSession(supabase as never, {
      id: "11111111-1111-4111-8111-111111111111",
      email: "allowed.employee@example.com",
      app_metadata: { provider: "azure" },
    });

    expect(result).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith("has_active_approved_access", {
      p_user_id: "11111111-1111-4111-8111-111111111111",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a matching company email authenticated by password", async () => {
    const supabase = { rpc: vi.fn(), from: vi.fn() };

    const result = await getProfileSession(supabase as never, {
      id: "11111111-1111-4111-8111-111111111111",
      email: "allowed.employee@example.com",
      app_metadata: { provider: "email" },
    });

    expect(result).toBeNull();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
