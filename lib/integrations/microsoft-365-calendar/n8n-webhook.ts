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

export type N8nCalendarUpdatePayload = Omit<
  N8nCalendarCreatePayload,
  "action"
> & {
  action: "update";
  externalEventId: string;
};

export type N8nCalendarDeletePayload = {
  action: "delete";
  bookingId: string;
  externalEventId: string;
};

type N8nCalendarWebhookPayload =
  | N8nCalendarCreatePayload
  | N8nCalendarUpdatePayload
  | N8nCalendarDeletePayload;

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
const bodyPreviewLength = 280;
const bookingSystemUserAgent = "BookingSystem/1.0";

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

function getSafeWebhookTarget(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "configured n8n webhook";
  }
}

function getSafeBodyPreview(body: string) {
  const compact = body.replace(/\s+/g, " ").trim();
  return sanitizeMicrosoftCalendarError(compact).slice(0, bodyPreviewLength);
}

function isProbablyJson(contentType: string, body: string) {
  const normalizedContentType = contentType.toLowerCase();
  const trimmedBody = body.trim();

  return (
    normalizedContentType.includes("application/json") ||
    normalizedContentType.includes("+json") ||
    trimmedBody.startsWith("{") ||
    trimmedBody.startsWith("[")
  );
}

function detectCloudflareChallenge(body: string, contentType: string) {
  const normalizedBody = body.toLowerCase();
  const normalizedContentType = contentType.toLowerCase();

  return (
    normalizedContentType.includes("text/html") &&
    (normalizedBody.includes("<title>just a moment") ||
      normalizedBody.includes("cf-ray") ||
      normalizedBody.includes("cloudflare"))
  );
}

function buildN8nResponseError({
  url,
  status,
  statusText,
  contentType,
  body,
  reason,
}: {
  url: string;
  status: number;
  statusText: string;
  contentType: string;
  body: string;
  reason: string;
}) {
  const target = getSafeWebhookTarget(url);
  const preview = getSafeBodyPreview(body);
  const cloudflareHint = detectCloudflareChallenge(body, contentType)
    ? " Cloudflare appears to be challenging the Vercel server request before n8n receives it. Add a Cloudflare skip/bypass rule for this webhook path or use a webhook-only subdomain."
    : "";
  const parts = [
    `${reason} from ${target}. Provider: n8n_webhook. Method: POST.`,
    `Status: ${status}${statusText ? ` ${statusText}` : ""}.`,
    `Content-Type: ${contentType || "unknown"}.`,
    preview ? `Body preview: ${preview}` : null,
    cloudflareHint || null,
  ].filter(Boolean);

  return sanitizeMicrosoftCalendarError(parts.join(" "));
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

export function buildN8nCalendarUpdatePayload({
  booking,
  externalEventId,
  timezone,
  appUrl = process.env.NEXT_PUBLIC_APP_URL,
}: {
  booking: N8nCalendarBookingForEvent;
  externalEventId: string;
  timezone: string;
  appUrl?: string;
}): N8nCalendarUpdatePayload {
  return {
    ...buildN8nCalendarCreatePayload({ booking, timezone, appUrl }),
    action: "update",
    externalEventId,
  };
}

export function buildN8nCalendarDeletePayload({
  bookingId,
  externalEventId,
}: {
  bookingId: string;
  externalEventId: string;
}): N8nCalendarDeletePayload {
  return {
    action: "delete",
    bookingId,
    externalEventId,
  };
}

function parseN8nWebhookResponse(
  data: unknown,
  fallbackExternalEventId?: string,
): N8nCalendarWebhookResult {
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
      : fallbackExternalEventId?.trim() ?? "";

  if (response.success !== true || !externalEventId) {
    return {
      ok: false,
      error: "n8n calendar webhook did not confirm event sync.",
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
  return sendN8nCalendarWebhook({
    config,
    url: config.createWebhookUrl,
    payload,
    fetchImpl,
  });
}

export async function sendN8nCalendarUpdateWebhook({
  config,
  payload,
  fetchImpl = fetch,
}: {
  config: N8nCalendarSyncConfig;
  payload: N8nCalendarUpdatePayload;
  fetchImpl?: FetchLike;
}): Promise<N8nCalendarWebhookResult> {
  if (!config.updateWebhookConfigured) {
    return {
      ok: false,
      error:
        "n8n update webhook is not configured. Set N8N_CALENDAR_UPDATE_WEBHOOK_URL or keep create-only mode.",
    };
  }

  return sendN8nCalendarWebhook({
    config,
    url: config.updateWebhookUrl,
    payload,
    fallbackExternalEventId: payload.externalEventId,
    fetchImpl,
  });
}

export async function sendN8nCalendarDeleteWebhook({
  config,
  payload,
  fetchImpl = fetch,
}: {
  config: N8nCalendarSyncConfig;
  payload: N8nCalendarDeletePayload;
  fetchImpl?: FetchLike;
}): Promise<N8nCalendarWebhookResult> {
  if (!config.deleteWebhookConfigured) {
    return {
      ok: false,
      error:
        "n8n delete webhook is not configured. Set N8N_CALENDAR_DELETE_WEBHOOK_URL or keep create-only mode.",
    };
  }

  return sendN8nCalendarWebhook({
    config,
    url: config.deleteWebhookUrl,
    payload,
    fallbackExternalEventId: payload.externalEventId,
    fetchImpl,
  });
}

async function sendN8nCalendarWebhook({
  config,
  url,
  payload,
  fallbackExternalEventId,
  fetchImpl = fetch,
}: {
  config: N8nCalendarSyncConfig;
  url: string;
  payload: N8nCalendarWebhookPayload;
  fallbackExternalEventId?: string;
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
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
        "User-Agent": bookingSystemUserAgent,
        "x-booking-system-secret": config.webhookSecret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const looksLikeHtml = text.trimStart().startsWith("<");

    if (!isProbablyJson(contentType, text) || looksLikeHtml) {
      return {
        ok: false,
        status: response.status,
        error: buildN8nResponseError({
          url,
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text,
          reason: "n8n webhook returned non-JSON response",
        }),
      };
    }

    let data: unknown;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        status: response.status,
        error: buildN8nResponseError({
          url,
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text,
          reason: "n8n webhook returned invalid JSON",
        }),
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: buildN8nResponseError({
          url,
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text,
          reason: "n8n calendar webhook failed",
        }),
      };
    }

    const parsed = parseN8nWebhookResponse(data, fallbackExternalEventId);
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
