import { describe, expect, it } from "vitest";

import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";
import { buildMicrosoftCalendarEventPayload } from "@/lib/integrations/microsoft-365-calendar/event-mapper";
import {
  buildN8nCalendarCreatePayload,
  sendN8nCalendarCreateWebhook,
} from "@/lib/integrations/microsoft-365-calendar/n8n-webhook";

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

  it("maps confirmed bookings to the n8n create webhook payload", () => {
    const payload = buildN8nCalendarCreatePayload({
      timezone: "Asia/Kuala_Lumpur",
      appUrl: "https://booking.example.com/",
      booking: {
        id: "booking-1",
        title: "VIP meeting",
        description: "Management review",
        status: "confirmed",
        startsAt: "2026-05-14T02:00:00.000Z",
        endsAt: "2026-05-14T03:00:00.000Z",
        attendeeCount: 8,
        catering: {
          required: true,
          type: "vip_catering",
          pax: 8,
          servingTime: "before_meeting",
          dietaryNotes: "Halal",
          notes: "Coffee and tea",
        },
        facility: {
          name: "Board Room",
          level: "Level 10",
          type: "meeting_room",
        },
        owner: {
          email: "owner@example.com",
          fullName: "Owner User",
        },
      },
    });

    expect(payload).toMatchObject({
      action: "create",
      bookingId: "booking-1",
      bookingReference: "booking-1",
      title: "VIP meeting",
      facilityName: "Board Room",
      facilityLevel: "Level 10",
      facilityType: "meeting_room",
      startTime: "2026-05-14T10:00:00",
      endTime: "2026-05-14T11:00:00",
      timezone: "Asia/Kuala_Lumpur",
      organizerName: "Owner User",
      organizerEmail: "owner@example.com",
      attendeeCount: 8,
      cateringRequired: true,
      bookingUrl: "https://booking.example.com/admin/bookings/booking-1",
    });
    expect(payload.cateringSummary).toContain("vip catering");
    expect(payload.cateringSummary).toContain("8 pax");
  });

  it("sends n8n create webhooks without putting the secret in the body", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({
          success: true,
          provider: "n8n_graph_delegated",
          externalEventId: "event-1",
          externalCalendarId: "me",
          webLink: "https://outlook.example/event",
        }),
        { status: 200 },
      );
    };

    const result = await sendN8nCalendarCreateWebhook({
      config: {
        provider: "n8n_webhook",
        enabled: true,
        createWebhookUrl: "https://n8n.example/webhook/create",
        updateWebhookUrl: "",
        deleteWebhookUrl: "",
        webhookSecret: "super-secret-value",
        missingKeys: [],
        isConfigured: true,
        validationError: null,
        createWebhookConfigured: true,
        updateWebhookConfigured: false,
        deleteWebhookConfigured: false,
        createWebhookUsesTestUrl: false,
      },
      payload: {
        action: "create",
        bookingId: "booking-1",
        bookingReference: "booking-1",
        title: "Meeting",
        description: null,
        facilityName: "Room",
        facilityLevel: "Level 1",
        facilityType: null,
        startTime: "2026-05-14T10:00:00",
        endTime: "2026-05-14T11:00:00",
        timezone: "Asia/Kuala_Lumpur",
        organizerName: "Owner",
        organizerEmail: "owner@example.com",
        attendeeCount: 2,
        cateringRequired: false,
        cateringSummary: "Not requested",
        bookingUrl: null,
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result).toMatchObject({
      ok: true,
      externalEventId: "event-1",
      externalCalendarId: "me",
    });
    expect(calls[0]?.init.headers as Record<string, string>).toMatchObject({
      "x-booking-system-secret": "super-secret-value",
    });
    expect(String(calls[0]?.init.body)).not.toContain("super-secret-value");
  });

  it("sanitizes n8n webhook failure details", async () => {
    const result = await sendN8nCalendarCreateWebhook({
      config: {
        provider: "n8n_webhook",
        enabled: true,
        createWebhookUrl: "https://n8n.example/webhook/create",
        updateWebhookUrl: "",
        deleteWebhookUrl: "",
        webhookSecret: "super-secret-value",
        missingKeys: [],
        isConfigured: true,
        validationError: null,
        createWebhookConfigured: true,
        updateWebhookConfigured: false,
        deleteWebhookConfigured: false,
        createWebhookUsesTestUrl: false,
      },
      payload: {
        action: "create",
        bookingId: "booking-1",
        bookingReference: "booking-1",
        title: "Meeting",
        description: null,
        facilityName: "Room",
        facilityLevel: "Level 1",
        facilityType: null,
        startTime: "2026-05-14T10:00:00",
        endTime: "2026-05-14T11:00:00",
        timezone: "Asia/Kuala_Lumpur",
        organizerName: null,
        organizerEmail: null,
        attendeeCount: null,
        cateringRequired: false,
        cateringSummary: "Not requested",
        bookingUrl: null,
      },
      fetchImpl: (async () =>
        new Response(
          "https://n8n.example/webhook/create x-booking-system-secret: super-secret-value",
          { status: 500 },
        )) as typeof fetch,
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).not.toContain("super-secret-value");
    expect(result.ok ? "" : result.error).toContain("n8n.example/webhook/create");
  });

  it("reports HTML responses without throwing raw JSON parse errors", async () => {
    const result = await sendN8nCalendarCreateWebhook({
      config: {
        provider: "n8n_webhook",
        enabled: true,
        createWebhookUrl:
          "https://n.qsbportal.com.my/webhook/booking-calendar/create?token=secret",
        updateWebhookUrl: "",
        deleteWebhookUrl: "",
        webhookSecret: "super-secret-value",
        missingKeys: [],
        isConfigured: true,
        validationError: null,
        createWebhookConfigured: true,
        updateWebhookConfigured: false,
        deleteWebhookConfigured: false,
        createWebhookUsesTestUrl: false,
      },
      payload: {
        action: "create",
        bookingId: "booking-1",
        bookingReference: "booking-1",
        title: "Meeting",
        description: null,
        facilityName: "Room",
        facilityLevel: "Level 1",
        facilityType: null,
        startTime: "2026-05-14T10:00:00",
        endTime: "2026-05-14T11:00:00",
        timezone: "Asia/Kuala_Lumpur",
        organizerName: null,
        organizerEmail: null,
        attendeeCount: null,
        cateringRequired: false,
        cateringSummary: "Not requested",
        bookingUrl: null,
      },
      fetchImpl: (async () =>
        new Response("<!DOCTYPE html><html><body>Not found</body></html>", {
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "text/html; charset=utf-8" },
        })) as typeof fetch,
    });

    expect(result.ok).toBe(false);
    const error = result.ok ? "" : result.error;
    expect(error).toContain("n8n webhook returned non-JSON response");
    expect(error).toContain(
      "n.qsbportal.com.my/webhook/booking-calendar/create",
    );
    expect(error).toContain("Status: 404 Not Found");
    expect(error).toContain("Content-Type: text/html");
    expect(error).toContain("Body preview: <!DOCTYPE html>");
    expect(error).not.toContain("Unexpected token");
    expect(error).not.toContain("token=secret");
    expect(error).not.toContain("super-secret-value");
  });

  it("reports invalid JSON responses with status and safe body preview", async () => {
    const result = await sendN8nCalendarCreateWebhook({
      config: {
        provider: "n8n_webhook",
        enabled: true,
        createWebhookUrl: "https://n8n.example/webhook/create",
        updateWebhookUrl: "",
        deleteWebhookUrl: "",
        webhookSecret: "super-secret-value",
        missingKeys: [],
        isConfigured: true,
        validationError: null,
        createWebhookConfigured: true,
        updateWebhookConfigured: false,
        deleteWebhookConfigured: false,
        createWebhookUsesTestUrl: false,
      },
      payload: {
        action: "create",
        bookingId: "booking-1",
        bookingReference: "booking-1",
        title: "Meeting",
        description: null,
        facilityName: "Room",
        facilityLevel: "Level 1",
        facilityType: null,
        startTime: "2026-05-14T10:00:00",
        endTime: "2026-05-14T11:00:00",
        timezone: "Asia/Kuala_Lumpur",
        organizerName: null,
        organizerEmail: null,
        attendeeCount: null,
        cateringRequired: false,
        cateringSummary: "Not requested",
        bookingUrl: null,
      },
      fetchImpl: (async () =>
        new Response("{not-json", {
          status: 200,
          headers: { "content-type": "application/json" },
        })) as typeof fetch,
    });

    expect(result.ok).toBe(false);
    const error = result.ok ? "" : result.error;
    expect(error).toContain("n8n webhook returned invalid JSON");
    expect(error).toContain("Status: 200");
    expect(error).toContain("Content-Type: application/json");
    expect(error).toContain("Body preview: {not-json");
    expect(error).not.toContain("Unexpected token");
  });
});
