import { describe, expect, it } from "vitest";

import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";
import { buildMicrosoftCalendarEventPayload } from "@/lib/integrations/microsoft-365-calendar/event-mapper";

describe("Microsoft 365 calendar sync helpers", () => {
  it("maps confirmed bookings to safe Microsoft Graph event payloads", () => {
    const payload = buildMicrosoftCalendarEventPayload({
      timezone: "Asia/Kuala_Lumpur",
      appUrl: "https://booking.example.com/",
      booking: {
        id: "booking-1",
        title: "Planning <Session>",
        description: "Discuss quarterly goals",
        status: "confirmed",
        startsAt: "2026-05-14T02:00:00.000Z",
        endsAt: "2026-05-14T03:00:00.000Z",
        facility: {
          name: "Meeting Room 1",
          level: "Level 5",
        },
        owner: {
          email: "owner@example.com",
          fullName: "Owner User",
        },
      },
    });

    expect(payload.subject).toBe("Booking: Planning <Session> - Meeting Room 1");
    expect(payload.location.displayName).toBe("Meeting Room 1, Level 5");
    expect(payload.start).toEqual({
      dateTime: "2026-05-14T10:00:00",
      timeZone: "Asia/Kuala_Lumpur",
    });
    expect(payload.end).toEqual({
      dateTime: "2026-05-14T11:00:00",
      timeZone: "Asia/Kuala_Lumpur",
    });
    expect(payload.body.content).toContain("Planning &lt;Session&gt;");
    expect(payload.body.content).toContain(
      "https://booking.example.com/admin/bookings/booking-1",
    );
    expect(payload).not.toHaveProperty("attendees");
  });

  it("sanitizes token and secret-like Microsoft errors", () => {
    const sanitized = sanitizeMicrosoftCalendarError(
      "Authorization: Bearer abc.def.ghi client_secret=very-secret access_token: token-value",
    );

    expect(sanitized).toContain("Bearer [redacted]");
    expect(sanitized).toContain("client_secret=[redacted]");
    expect(sanitized).not.toContain("very-secret");
    expect(sanitized).not.toContain("token-value");
  });
});
