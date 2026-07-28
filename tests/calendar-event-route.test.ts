import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentAuthState: vi.fn(),
  getAuthorizedCalendarEventUrl: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentAuthState: mocks.getCurrentAuthState }));
vi.mock("@/lib/bookings/teams-meeting-status", () => ({
  getAuthorizedCalendarEventUrl: mocks.getAuthorizedCalendarEventUrl,
}));

import { GET } from "@/app/bookings/[id]/calendar/route";

const bookingId = "11111111-1111-4111-8111-111111111111";

describe("calendar event redirect route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAuthState.mockResolvedValue({
      user: { id: "owner-1" },
      profile: { status: "active" },
    });
  });

  it("redirects an authorised user to the current Outlook event", async () => {
    mocks.getAuthorizedCalendarEventUrl.mockResolvedValue(
      "https://outlook.office.com/calendar/item/example",
    );

    const response = await GET(new Request(`https://qbook.example.com/bookings/${bookingId}/calendar`) as never, {
      params: Promise.resolve({ id: bookingId }),
    });

    expect(response.headers.get("location")).toBe(
      "https://outlook.office.com/calendar/item/example",
    );
  });

  it("returns to the booking with a clear state when the event is unavailable", async () => {
    mocks.getAuthorizedCalendarEventUrl.mockResolvedValue(null);

    const response = await GET(new Request(`https://qbook.example.com/bookings/${bookingId}/calendar`) as never, {
      params: Promise.resolve({ id: bookingId }),
    });

    expect(response.headers.get("location")).toBe(
      `https://qbook.example.com/bookings/${bookingId}?calendar=unavailable`,
    );
  });

  it("keeps an unauthenticated recipient on the calendar route after sign-in", async () => {
    mocks.getCurrentAuthState.mockResolvedValue({ user: null, profile: null });

    const response = await GET(new Request(`https://qbook.example.com/bookings/${bookingId}/calendar`) as never, {
      params: Promise.resolve({ id: bookingId }),
    });

    expect(response.headers.get("location")).toBe(
      `https://qbook.example.com/login?auth=required&next=%2Fbookings%2F${bookingId}%2Fcalendar`,
    );
  });
});
