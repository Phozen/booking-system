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
    vi.clearAllMocks();
    process.env.MICROSOFT_TENANT_ID = "11111111-1111-4111-8111-111111111111";
    process.env.CALENDAR_SYNC_PROVIDER = "microsoft_graph";
    process.env.MICROSOFT_365_CALENDAR_SYNC_ENABLED = "true";
    process.env.MICROSOFT_SYNC_MODE = "booking_owner_calendar";
    process.env.MICROSOFT_GRAPH_AUTH_MODE = "delegated";
    process.env.MICROSOFT_CLIENT_ID = "calendar-client-id";
    process.env.MICROSOFT_CLIENT_SECRET = "calendar-client-secret";
    process.env.MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY =
      "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
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

  it("preserves a safe booking destination through Microsoft sign-in", async () => {
    const formData = new FormData();
    formData.set("next", "/bookings/11111111-1111-4111-8111-111111111111/calendar");

    await expect(loginWithMicrosoftAction(formData)).rejects.toThrow(
      "redirect:https://login.microsoftonline.com/authorize",
    );

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "azure",
      options: expect.objectContaining({
        redirectTo:
          "https://qbook.example.com/auth/callback?next=%2Fbookings%2F11111111-1111-4111-8111-111111111111%2Fcalendar",
      }),
    });
  });

  it("does not request calendar consent before delegated owner sync is ready", async () => {
    process.env.MICROSOFT_365_CALENDAR_SYNC_ENABLED = "false";

    await expect(connectMicrosoftCalendarAction()).rejects.toThrow(
      "redirect:https://qbook.example.com/profile?calendar=unavailable",
    );

    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
  });
});
