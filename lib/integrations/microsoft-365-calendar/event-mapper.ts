import type { MicrosoftGraphEventPayload } from "@/lib/integrations/microsoft-365-calendar/types";

export type MicrosoftCalendarBookingForEvent = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  facility: {
    name: string;
    level: string;
  } | null;
  owner: {
    email: string;
    fullName: string | null;
  } | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toGraphDateTime(value: string, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function buildBookingLink(bookingId: string, appUrl: string | undefined) {
  const baseUrl = appUrl?.trim().replace(/\/+$/, "");
  return baseUrl ? `${baseUrl}/admin/bookings/${bookingId}` : null;
}

export function buildMicrosoftCalendarEventPayload({
  booking,
  timezone,
  appUrl = process.env.NEXT_PUBLIC_APP_URL,
}: {
  booking: MicrosoftCalendarBookingForEvent;
  timezone: string;
  appUrl?: string;
}): MicrosoftGraphEventPayload {
  const facilityName = booking.facility?.name ?? "Facility";
  const facilityLevel = booking.facility?.level ?? "Level not set";
  const organizer =
    booking.owner?.fullName || booking.owner?.email || "Booking requester";
  const bookingLink = buildBookingLink(booking.id, appUrl);
  const description = booking.description?.trim();
  const bodyLines = [
    `<p><strong>Booking:</strong> ${escapeHtml(booking.title)}</p>`,
    description ? `<p><strong>Purpose:</strong> ${escapeHtml(description)}</p>` : null,
    `<p><strong>Facility:</strong> ${escapeHtml(facilityName)}</p>`,
    `<p><strong>Level:</strong> ${escapeHtml(facilityLevel)}</p>`,
    `<p><strong>Organizer:</strong> ${escapeHtml(organizer)}</p>`,
    `<p><strong>Status:</strong> ${escapeHtml(booking.status)}</p>`,
    bookingLink
      ? `<p><a href="${escapeHtml(bookingLink)}">View booking in Booking System</a></p>`
      : null,
  ].filter(Boolean);

  return {
    subject: `Booking: ${booking.title} - ${facilityName}`,
    body: {
      contentType: "HTML",
      content: bodyLines.join("\n"),
    },
    start: {
      dateTime: toGraphDateTime(booking.startsAt, timezone),
      timeZone: timezone,
    },
    end: {
      dateTime: toGraphDateTime(booking.endsAt, timezone),
      timeZone: timezone,
    },
    location: {
      displayName: `${facilityName}, ${facilityLevel}`,
    },
    showAs: "busy",
  };
}
