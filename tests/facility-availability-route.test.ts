import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentAuthState: vi.fn(),
  getAppSettings: vi.fn(),
  getFacilityAvailabilityTimeline: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({
  getCurrentAuthState: mocks.getCurrentAuthState,
}));
vi.mock("@/lib/settings/queries", () => ({
  getAppSettings: mocks.getAppSettings,
}));
vi.mock("@/lib/facilities/availability-timeline", () => ({
  getFacilityAvailabilityTimeline: mocks.getFacilityAvailabilityTimeline,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { GET } from "@/app/api/facility-availability/route";

const facilityId = "11111111-1111-4111-8111-111111111111";
const date = "2026-08-19";

function request(search = `facilityId=${facilityId}&date=${date}`) {
  return new Request(
    `https://qbook.example.com/api/facility-availability?${search}`,
  );
}

describe("facility availability API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAuthState.mockResolvedValue({
      user: { id: "user-1" },
      profile: { status: "active" },
    });
    mocks.getAppSettings.mockResolvedValue({
      defaultTimezone: "Asia/Kuala_Lumpur",
    });
    mocks.createAdminClient.mockReturnValue({ admin: true });
    mocks.getFacilityAvailabilityTimeline.mockResolvedValue([]);
  });

  it("returns JSON 401 instead of a login redirect when signed out", async () => {
    mocks.getCurrentAuthState.mockResolvedValue({ user: null, profile: null });

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required.",
    });
    expect(response.headers.get("location")).toBeNull();
    expect(mocks.getFacilityAvailabilityTimeline).not.toHaveBeenCalled();
  });

  it("returns JSON 401 when the account is not active", async () => {
    mocks.getCurrentAuthState.mockResolvedValue({
      user: { id: "user-1" },
      profile: { status: "disabled" },
    });

    const response = await GET(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required.",
    });
    expect(mocks.getFacilityAvailabilityTimeline).not.toHaveBeenCalled();
  });

  it("returns JSON 400 for invalid query params", async () => {
    const response = await GET(request("facilityId=not-a-uuid&date=19-08-2026"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Choose a facility and date to view availability.",
    });
    expect(mocks.getFacilityAvailabilityTimeline).not.toHaveBeenCalled();
  });

  it("returns timeline items for an active signed-in user", async () => {
    mocks.getFacilityAvailabilityTimeline.mockResolvedValue([
      { id: "slot-1", type: "available" },
    ]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [{ id: "slot-1", type: "available" }],
    });
    expect(mocks.getFacilityAvailabilityTimeline).toHaveBeenCalledWith(
      { admin: true },
      {
        facilityId,
        date,
        timezone: "Asia/Kuala_Lumpur",
      },
    );
  });
});
