import type { N8nCalendarSyncConfig } from "@/lib/integrations/microsoft-365-calendar/config";
import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";
import { toCalendarLocalDateTime } from "@/lib/integrations/microsoft-365-calendar/event-mapper";

export type N8nCalendarBookingForEvent = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  attendeeCount: number | null;
  catering: {
    required: boolean;
    type: string | null;
    pax: number | null;
    servingTime: string | null;
    dietaryNotes: string | null;
    notes: string | null;
  };
  facility: {
    name: string;
    level: string;
    type: string | null;
  } | null;
  owner: {
    email: string;
    fullName: string | null;
  } | null;
};

export type N8nCalendarCreatePayload = {
  action: "create";
  bookingId: string;
  bookingReference: string;
  title: string;
  description: string | null;
  facilityName: string;
  facilityLevel: string;
  facilityType: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  organizerName: string | null;
  organizerEmail: string | null;
  attendeeCount: number | null;
  cateringRequired: boolean;
  cateringSummary: string;
  bookingUrl: string | null;
};

export type N8nCalendarWebhookResult =
  | {
      ok: true;
      externalEventId: string;
      externalCalendarId: string | null;
      webLink: string | null;
      provider: string | null;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

type FetchLike = typeof fetch;

function labelValue(value: string | null | undefined) {
  return value?.trim() || null;
}

function formatLabel(value: string | null | undefined) {
  return labelValue(value)?.replaceAll("_", " ") ?? null;
}

export function buildN8nCateringSummary(
  catering: N8nCalendarBookingForEvent["catering"],
) {
  if (!catering.required) {
    return "Not requested";
  }

  const parts = [
    formatLabel(catering.type),
    catering.pax ? `${catering.pax} pax` : null,
    formatLabel(catering.servingTime),
    labelValue(catering.dietaryNotes)
      ? `Dietary notes: ${catering.dietaryNotes?.trim()}`
      : null,
    labelValue(catering.notes) ? `Notes: ${catering.notes?.trim()}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("; ") : "Requested";
}

function buildBookingUrl(bookingId: string, appUrl: string | undefined) {
  const baseUrl = appUrl?.trim().replace(/\/+$/, "");
  return baseUrl ? `${baseUrl}/admin/bookings/${bookingId}` : null;
}

export function buildN8nCalendarCreatePayload({
  booking,
  timezone,
  appUrl = process.env.NEXT_PUBLIC_APP_URL,
}: {
  booking: N8nCalendarBookingForEvent;
  timezone: string;
  appUrl?: string;
}): N8nCalendarCreatePayload {
  return {
    action: "create",
    bookingId: booking.id,
    bookingReference: booking.id,
    title: booking.title,
    description: booking.description,
    facilityName: booking.facility?.name ?? "Facility",
    facilityLevel: booking.facility?.level ?? "Level not set",
    facilityType: booking.facility?.type ?? null,
    startTime: toCalendarLocalDateTime(booking.startsAt, timezone),
    endTime: toCalendarLocalDateTime(booking.endsAt, timezone),
    timezone,
    organizerName: booking.owner?.fullName ?? null,
    organizerEmail: booking.owner?.email ?? null,
    attendeeCount: booking.attendeeCount,
    cateringRequired: booking.catering.required,
    cateringSummary: buildN8nCateringSummary(booking.catering),
    bookingUrl: buildBookingUrl(booking.id, appUrl),
  };
}

function parseN8nCreateResponse(data: unknown): N8nCalendarWebhookResult {
  if (!data || typeof data !== "object") {
    return {
      ok: false,
      error: "n8n calendar webhook returned an invalid response.",
    };
  }

  const response = data as Record<string, unknown>;
  const externalEventId =
    typeof response.externalEventId === "string"
      ? response.externalEventId.trim()
      : "";

  if (response.success !== true || !externalEventId) {
    return {
      ok: false,
      error: "n8n calendar webhook did not confirm event creation.",
    };
  }

  return {
    ok: true,
    externalEventId,
    externalCalendarId:
      typeof response.externalCalendarId === "string"
        ? response.externalCalendarId
        : null,
    webLink: typeof response.webLink === "string" ? response.webLink : null,
    provider: typeof response.provider === "string" ? response.provider : null,
  };
}

export async function sendN8nCalendarCreateWebhook({
  config,
  payload,
  fetchImpl = fetch,
}: {
  config: N8nCalendarSyncConfig;
  payload: N8nCalendarCreatePayload;
  fetchImpl?: FetchLike;
}): Promise<N8nCalendarWebhookResult> {
  if (!config.isConfigured) {
    return {
      ok: false,
      error:
        config.validationError ?? "n8n calendar webhook sync is not configured.",
    };
  }

  try {
    const response = await fetchImpl(config.createWebhookUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-booking-system-secret": config.webhookSecret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: sanitizeMicrosoftCalendarError(
          `n8n calendar webhook failed with status ${response.status}: ${text}`,
        ),
      };
    }

    const parsed = parseN8nCreateResponse(data);
    return parsed.ok
      ? parsed
      : {
          ...parsed,
          error: sanitizeMicrosoftCalendarError(parsed.error),
        };
  } catch (error) {
    return {
      ok: false,
      error: sanitizeMicrosoftCalendarError(error),
    };
  }
}
