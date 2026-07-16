import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getPostLoginPath: vi.fn(),
  saveCalendarConnection: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/auth/session", () => ({
  getPostLoginPath: mocks.getPostLoginPath,
}));

vi.mock("@/lib/integrations/microsoft-365-calendar/delegated", () => ({
  saveMicrosoftDelegatedCalendarConnection: mocks.saveCalendarConnection,
}));

import { GET } from "@/app/auth/callback/route";

const tenantId = "11111111-2222-4333-8444-555555555555";
const providerToken = `header.${Buffer.from(JSON.stringify({ tid: tenantId })).toString("base64url")}.signature`;

function createAdminWithTenant() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { tenant_id: tenantId },
            error: null,
          }),
        })),
      })),
    })),
  };
}

function createSupabase() {
  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "11111111-1111-4111-8111-111111111111",
            email: "allowed.employee@example.com",
            app_metadata: { provider: "azure" },
            user_metadata: {},
            identities: [],
          },
          session: { provider_token: providerToken },
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

describe("Microsoft auth callback security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminClient.mockReturnValue(createAdminWithTenant());
  });

  it("does not persist delegated tokens for an unlisted existing Azure user", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);
    mocks.getPostLoginPath.mockResolvedValue("/login?error=disabled");

    const response = await GET(
      new Request("https://qbook.example.com/auth/callback?code=abc") as never,
    );

    expect(response.headers.get("location")).toBe(
      "https://qbook.example.com/login?error=disabled",
    );
    expect(mocks.saveCalendarConnection).not.toHaveBeenCalled();
  });

  it("does not persist delegated calendar tokens during ordinary Microsoft sign-in", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);
    mocks.getPostLoginPath.mockResolvedValue("/dashboard");

    const response = await GET(
      new Request("https://qbook.example.com/auth/callback?code=abc") as never,
    );

    expect(response.headers.get("location")).toBe(
      "https://qbook.example.com/dashboard",
    );
    expect(mocks.saveCalendarConnection).not.toHaveBeenCalled();
  });

  it("persists delegated calendar tokens only for the explicit calendar connection", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);
    mocks.getPostLoginPath.mockResolvedValue("/profile");
    mocks.saveCalendarConnection.mockResolvedValue(undefined);

    const response = await GET(
      new Request(
        "https://qbook.example.com/auth/callback?code=abc&calendar=connected&next=/profile",
      ) as never,
    );

    expect(mocks.saveCalendarConnection).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe(
      "https://qbook.example.com/profile?calendar=connected",
    );
  });

  it("signs out when an unexpected post-exchange exception occurs", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);
    mocks.getPostLoginPath.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(
      new Request("https://qbook.example.com/auth/callback?code=abc") as never,
    );

    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe(
      "https://qbook.example.com/login?error=callback",
    );
    expect(mocks.saveCalendarConnection).not.toHaveBeenCalled();
  });
});
