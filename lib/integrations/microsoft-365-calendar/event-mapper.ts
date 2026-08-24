import { buildBookingDetailSections, detailSectionsToHtml } from "@/lib/email/booking-details";
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
  attendees: {
    email: string;
    name: string | null;
  }[];
  teamsMeeting?: boolean;
};

export function toCalendarLocalDateTime(value: string, timezone: string) {
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildAttendees(
  booking: MicrosoftCalendarBookingForEvent,
): NonNullable<MicrosoftGraphEventPayload["attendees"]> {
  const ownerEmail = booking.owner?.email.trim().toLowerCase() ?? "";
  const seen = new Set<string>();

  return booking.attendees
    .map((attendee) => ({
      email: attendee.email.trim().toLowerCase(),
      name: attendee.name?.trim() || attendee.email.trim(),
    }))
    .filter((attendee) => {
      if (
        !attendee.email ||
        !isValidEmail(attendee.email) ||
        attendee.email === ownerEmail ||
        seen.has(attendee.email)
      ) {
        return false;
      }

      seen.add(attendee.email);
      return true;
    })
    .map((attendee) => ({
      emailAddress: {
        address: attendee.email,
        name: attendee.name,
      },
      type: "required" as const,
    }));
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
  const bookingLink = buildBookingLink(booking.id, appUrl);

  const sections = buildBookingDetailSections({
    facilityName,
    facilityLevel,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    title: booking.title,
    description: booking.description,
    attendeeCount: null,
    invitees: booking.attendees.map((a) => ({ name: a.name, email: a.email })),
    departments: null,
    teamsMeeting: booking.teamsMeeting,
    cateringRequired: false,
    requesterName: booking.owner?.fullName,
    requesterEmail: booking.owner?.email,
    status: booking.status,
    bookingLink: bookingLink,
  });

  const bodyLines = [detailSectionsToHtml(sections)].filter(Boolean);

  const attendees = buildAttendees(booking);

  return {
    subject: `Booking: ${booking.title} - ${facilityName}`,
    body: {
      contentType: "HTML",
      content: bodyLines.join("\n"),
    },
    start: {
      dateTime: toCalendarLocalDateTime(booking.startsAt, timezone),
      timeZone: timezone,
    },
    end: {
      dateTime: toCalendarLocalDateTime(booking.endsAt, timezone),
      timeZone: timezone,
    },
    location: {
      displayName: `${facilityName}, ${facilityLevel}`,
    },
    showAs: "busy",
    ...(booking.teamsMeeting
      ? { isOnlineMeeting: true as const, onlineMeetingProvider: "teamsForBusiness" as const }
      : {}),
    ...(attendees.length > 0 ? { attendees } : {}),
  };
}
