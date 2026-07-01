import { describe, expect, it, vi } from "vitest";

import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";
import { buildMicrosoftCalendarEventPayload } from "@/lib/integrations/microsoft-365-calendar/event-mapper";
import { buildMicrosoftGraphPath } from "@/lib/integrations/microsoft-365-calendar/client";
import {
  buildN8nCalendarCreatePayload,
  buildN8nCalendarDeletePayload,
  buildN8nCalendarUpdatePayload,
  sendN8nCalendarCreateWebhook,
  sendN8nCalendarDeleteWebhook,
  sendN8nCalendarUpdateWebhook,
} from "@/lib/integrations/microsoft-365-calendar/n8n-webhook";
import {
  resolveMicrosoftCalendarTarget,
  resolveMicrosoftDelegatedCalendarTarget,
} from "@/lib/integrations/microsoft-365-calendar/sync";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/integrations/microsoft-365-calendar/delegated", () => ({
  getMicrosoftDelegatedAccessToken: vi.fn(async () => ({
    ok: true,
    accessToken: "delegated-access-token",
    connection: {
      user_id: "user-1",
      microsoft_email: "owner@example.com",
      microsoft_tenant_id: "tenant-id",
      microsoft_account_id: "account-id",
      scopes: ["Calendars.ReadWrite"],
      encrypted_access_token: "encrypted",
      encrypted_refresh_token: "encrypted",
      access_token_expires_at: "2026-07-01T00:00:00.000Z",
      status: "connected",
      last_connected_at: "2026-07-01T00:00:00.000Z",
      last_refreshed_at: null,
      last_error: null,
    },
  })),
}));

function getConfiguredN8nConfig() {
  return {
    provider: "n8n_webhook" as const,
    enabled: true,
    createWebhookUrl: "https://n8n.example/webhook/create",
    updateWebhookUrl: "https://n8n.example/webhook/update",
    deleteWebhookUrl: "https://n8n.example/webhook/delete",
    webhookSecret: "super-secret-value",
    missingKeys: [],
    isConfigured: true,
    validationError: null,
    createWebhookConfigured: true,
    updateWebhookConfigured: true,
    deleteWebhookConfigured: true,
    createWebhookUsesTestUrl: false,
    lifecycleMode: "full_lifecycle" as const,
  };
}

describe("Microsoft 365 calendar sync helpers", () => {
  function getTargetBooking(ownerEmail: string | null) {
    return {
      id: "booking-1",
      user_id: "user-1",
      title: "Planning",
      description: null,
      status: "confirmed",
      starts_at: "2026-05-14T02:00:00.000Z",
      ends_at: "2026-05-14T03:00:00.000Z",
      attendee_count: 4,
      catering_required: false,
      catering_type: null,
      catering_pax: null,
      catering_serving_time: null,
      catering_dietary_notes: null,
      catering_notes: null,
      facilities: {
        name: "Meeting Room 1",
        level: "Level 5",
        type: "meeting_room",
      },
      profiles: ownerEmail
        ? {
            email: ownerEmail,
            full_name: "Owner User",
          }
        : null,
    };
  }

  it("resolves central Microsoft Graph sync to the configured mailbox", () => {
    const target = resolveMicrosoftCalendarTarget({
      booking: getTargetBooking("owner@example.com"),
      config: {
        mode: "central_calendar",
        defaultCalendarId: "booking-calendar@example.com",
      },
      settings: { allowedEmailDomains: ["example.com"] },
    });

    expect(target).toEqual({
      ok: true,
      calendarId: "booking-calendar@example.com",
    });
  });

  it("resolves booking-owner Microsoft Graph sync to the owner mailbox", () => {
    const target = resolveMicrosoftCalendarTarget({
      booking: getTargetBooking("Owner@Example.com"),
      config: {
        mode: "booking_owner_calendar",
        defaultCalendarId: "",
      },
      settings: { allowedEmailDomains: ["example.com"] },
    });

    expect(target).toEqual({
      ok: true,
      calendarId: "owner@example.com",
    });
    expect(
      target.ok
        ? buildMicrosoftGraphPath("users", target.calendarId, "events")
        : "",
    ).toBe("users/owner%40example.com/events");
  });

  it("keeps existing Microsoft Graph event targets for updates and deletes", () => {
    const target = resolveMicrosoftCalendarTarget({
      booking: getTargetBooking("new-owner@example.com"),
      config: {
        mode: "booking_owner_calendar",
        defaultCalendarId: "",
      },
      settings: { allowedEmailDomains: ["example.com"] },
      existingCalendarId: "old-owner@example.com",
    });

    expect(target).toEqual({
      ok: true,
      calendarId: "old-owner@example.com",
    });
  });

  it("resolves delegated booking-owner sync to the owner mailbox and /me path", async () => {
    const target = await resolveMicrosoftDelegatedCalendarTarget({
      booking: getTargetBooking("owner@example.com"),
      settings: { allowedEmailDomains: ["example.com"] },
    });

    expect(target).toEqual({
      ok: true,
      calendarId: "owner@example.com",
      accessToken: "delegated-access-token",
    });
    expect(target.ok ? buildMicrosoftGraphPath("me", "events") : "").toBe(
      "me/events",
    );
  });

  it.each([
    {
      label: "missing",
      ownerEmail: null,
      allowedEmailDomains: ["example.com"],
      message: "missing or invalid",
    },
    {
      label: "malformed",
      ownerEmail: "not-an-email",
      allowedEmailDomains: ["example.com"],
      message: "missing or invalid",
    },
    {
      label: "outside domain",
      ownerEmail: "owner@other.example",
      allowedEmailDomains: ["example.com"],
      message: "outside the allowed company domains",
    },
    {
      label: "no allowlist",
      ownerEmail: "owner@example.com",
      allowedEmailDomains: [],
      message: "Allowed email domains must be configured",
    },
  ])(
    "skips booking-owner Microsoft Graph sync for $label owner email",
    ({ ownerEmail, allowedEmailDomains, message }) => {
      const target = resolveMicrosoftCalendarTarget({
        booking: getTargetBooking(ownerEmail),
        config: {
          mode: "booking_owner_calendar",
          defaultCalendarId: "",
        },
        settings: { allowedEmailDomains },
      });

      expect(target.ok).toBe(false);
      expect(target.ok ? "" : target.message).toContain(message);
    },
  );

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

  it("maps updates with external event IDs to the n8n update payload", () => {
    const payload = buildN8nCalendarUpdatePayload({
      externalEventId: "event-1",
      timezone: "Asia/Kuala_Lumpur",
      appUrl: "https://booking.example.com/",
      booking: {
        id: "booking-1",
        title: "Rescheduled meeting",
        description: "Moved later",
        status: "confirmed",
        startsAt: "2026-05-14T04:00:00.000Z",
        endsAt: "2026-05-14T05:00:00.000Z",
        attendeeCount: 4,
        catering: {
          required: false,
          type: null,
          pax: null,
          servingTime: null,
          dietaryNotes: null,
          notes: null,
        },
        facility: {
          name: "Meeting Room 2",
          level: "Level 5",
          type: "meeting_room",
        },
        owner: {
          email: "owner@example.com",
          fullName: "Owner User",
        },
      },
    });

    expect(payload).toMatchObject({
      action: "update",
      externalEventId: "event-1",
      bookingId: "booking-1",
      title: "Rescheduled meeting",
      startTime: "2026-05-14T12:00:00",
      endTime: "2026-05-14T13:00:00",
      cateringRequired: false,
      cateringSummary: "Not requested",
    });
  });

  it("maps cancellations to a minimal n8n delete payload", () => {
    expect(
      buildN8nCalendarDeletePayload({
        bookingId: "booking-1",
        externalEventId: "event-1",
      }),
    ).toEqual({
      action: "delete",
      bookingId: "booking-1",
      externalEventId: "event-1",
    });
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
        lifecycleMode: "full_lifecycle",
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
      Accept: "application/json",
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "User-Agent": "BookingSystem/1.0",
      "x-booking-system-secret": "super-secret-value",
    });
    expect(String(calls[0]?.init.body)).not.toContain("super-secret-value");
  });

  it("sends n8n update webhooks to the configured update URL", async () => {
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
          status: "updated",
        }),
        { status: 200 },
      );
    };

    const result = await sendN8nCalendarUpdateWebhook({
      config: getConfiguredN8nConfig(),
      payload: {
        action: "update",
        externalEventId: "event-1",
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
    });
    expect(calls[0]?.url).toBe("https://n8n.example/webhook/update");
    expect(String(calls[0]?.init.body)).not.toContain("super-secret-value");
  });

  it("sends n8n delete webhooks to the configured delete URL", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({
          success: true,
          provider: "n8n_graph_delegated",
          externalEventId: "event-1",
          status: "deleted",
        }),
        { status: 200 },
      );
    };

    const result = await sendN8nCalendarDeleteWebhook({
      config: getConfiguredN8nConfig(),
      payload: {
        action: "delete",
        bookingId: "booking-1",
        externalEventId: "event-1",
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result).toMatchObject({
      ok: true,
      externalEventId: "event-1",
    });
    expect(calls[0]?.url).toBe("https://n8n.example/webhook/delete");
    expect(String(calls[0]?.init.body)).toBe(
      JSON.stringify({
        action: "delete",
        bookingId: "booking-1",
        externalEventId: "event-1",
      }),
    );
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
        lifecycleMode: "full_lifecycle",
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
        lifecycleMode: "full_lifecycle",
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
    expect(error).toContain("Provider: n8n_webhook");
    expect(error).toContain("Method: POST");
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

  it("adds a Cloudflare-specific hint for challenge pages", async () => {
    const result = await sendN8nCalendarCreateWebhook({
      config: {
        provider: "n8n_webhook",
        enabled: true,
        createWebhookUrl:
          "https://n.qsbportal.com.my/webhook/booking-calendar/create",
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
        lifecycleMode: "full_lifecycle",
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
          '<!DOCTYPE html><html><head><title>Just a moment...</title></head><body>cf-ray cloudflare</body></html>',
          {
            status: 403,
            statusText: "Forbidden",
            headers: { "content-type": "text/html; charset=UTF-8" },
          },
        )) as typeof fetch,
    });

    expect(result.ok).toBe(false);
    const error = result.ok ? "" : result.error;
    expect(error).toContain("Status: 403 Forbidden");
    expect(error).toContain("Cloudflare appears to be challenging");
    expect(error).toContain("webhook-only subdomain");
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
        lifecycleMode: "full_lifecycle",
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
