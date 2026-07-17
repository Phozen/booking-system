import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import {
  connectMicrosoftCalendarAction,
  loginWithMicrosoftAction,
} from "@/lib/auth/actions";

describe("Microsoft sign-in actions", () => {
  beforeEach(() => {
    process.env.MICROSOFT_TENANT_ID = "11111111-1111-4111-8111-111111111111";
    mocks.headers.mockResolvedValue(new Headers({ origin: "https://qbook.example.com" }));
    mocks.createClient.mockResolvedValue({
      auth: { signInWithOAuth: mocks.signInWithOAuth },
    });
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: "https://login.microsoftonline.com/authorize" },
      error: null,
    });
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it("shows Microsoft account choice for ordinary Qbook login", async () => {
    await expect(loginWithMicrosoftAction()).rejects.toThrow(
      "redirect:https://login.microsoftonline.com/authorize",
    );

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "azure",
      options: {
        redirectTo: "https://qbook.example.com/auth/callback",
        scopes: "openid email profile",
        queryParams: { prompt: "select_account" },
      },
    });
  });

  it("keeps explicit calendar connection consent separate from ordinary login", async () => {
    await expect(connectMicrosoftCalendarAction()).rejects.toThrow(
      "redirect:https://login.microsoftonline.com/authorize",
    );

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "azure",
      options: {
        redirectTo:
          "https://qbook.example.com/auth/callback?next=/profile&calendar=connected",
        scopes: "openid email profile offline_access User.Read Calendars.ReadWrite",
        queryParams: { prompt: "consent" },
      },
    });
  });
});
