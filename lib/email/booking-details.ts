import {
  formatBookingDate,
  formatBookingTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import {
  formatCateringServingTime,
  formatCateringType,
} from "@/lib/bookings/catering/format";

export function formatPersonLabel(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  const trimmedName = name?.trim() || null;
  const trimmedEmail = email?.trim() || null;

  if (trimmedName && trimmedEmail) {
    return `${trimmedName} (${trimmedEmail})`;
  }

  return trimmedName ?? trimmedEmail ?? null;
}

export function formatInviteeList(
  invitees: Array<{ name?: string | null; email?: string | null }>,
) {
  const labels = invitees
    .map((invitee) => formatPersonLabel(invitee.name, invitee.email))
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels.join(", ") : null;
}

export function getMeetingTypeLabel(teamsMeeting: unknown) {
  if (teamsMeeting === true || teamsMeeting === "true") {
    return "Teams meeting";
  }

  if (teamsMeeting === false || teamsMeeting === "false") {
    return "Room only";
  }

  return null;
}

export type BookingDetailInput = {
  facilityName?: string | null;
  facilityLevel?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  title?: string | null;
  description?: string | null;
  attendeeCount?: number | string | null;
  invitees?: Array<{ name?: string | null; email?: string | null }> | string | null;
  departments?: Array<{ name?: string | null; email?: string | null }> | string | null;
  teamsMeeting?: unknown;
  cateringRequired?: boolean;
  cateringType?: string | null;
  cateringPax?: number | string | null;
  cateringServingTime?: string | null;
  cateringDietaryNotes?: string | null;
  cateringNotes?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  status?: string | null;
  bookingLink?: string | null;
};

export type DetailRow = { label: string; value: string };

/**
 * Builds booking detail rows in create-form order. Empty optional fields
 * show a fallback so the list is always complete.
 */
export function buildBookingDetailRows(input: BookingDetailInput): DetailRow[] {
  const facility = [input.facilityName, input.facilityLevel]
    .filter(Boolean)
    .join(", ");
  const date = input.startsAt ? formatBookingDate(input.startsAt) : null;
  const time =
    input.startsAt && input.endsAt
      ? formatBookingWindow(input.startsAt, input.endsAt)
      : input.startsAt
        ? formatBookingTime(input.startsAt)
        : null;

  const inviteeDisplay =
    typeof input.invitees === "string"
      ? input.invitees
      : Array.isArray(input.invitees)
        ? formatInviteeList(input.invitees)
        : null;

  const departmentDisplay =
    typeof input.departments === "string"
      ? input.departments
      : Array.isArray(input.departments)
        ? input.departments
            .map((d) => {
              const name = d.name?.trim();
              const email = d.email?.trim();
              return name && email ? `${name} (${email})` : name ?? email ?? null;
            })
            .filter(Boolean)
            .join(", ") || null
        : null;

  const meetingType = getMeetingTypeLabel(input.teamsMeeting);

  const cateringLabel = input.cateringRequired ? "Yes" : "Not requested";
  const cateringTypeDisplay = input.cateringType
    ? formatCateringType(input.cateringType)
    : null;
  const cateringPaxDisplay =
    input.cateringPax != null && input.cateringPax !== ""
      ? String(input.cateringPax)
      : null;
  const cateringServingDisplay = input.cateringServingTime
    ? formatCateringServingTime(input.cateringServingTime)
    : null;

  const rows: DetailRow[] = [
    { label: "Room", value: facility || "Not provided" },
    { label: "Date", value: date || "Not provided" },
    { label: "Time", value: time || "Not provided" },
    { label: "Meeting name", value: input.title?.trim() || "Not provided" },
    { label: "Description", value: input.description?.trim() || "None" },
    {
      label: "How many people?",
      value:
        input.attendeeCount != null && input.attendeeCount !== ""
          ? String(input.attendeeCount)
          : "Not provided",
    },
    { label: "Invited staff", value: inviteeDisplay || "None" },
    { label: "Departments", value: departmentDisplay || "None" },
    { label: "Meeting type", value: meetingType || "Not provided" },
    { label: "Food and drinks", value: cateringLabel },
  ];

  if (input.cateringRequired) {
    rows.push(
      { label: "Catering type", value: cateringTypeDisplay || "Not provided" },
      { label: "Catering pax", value: cateringPaxDisplay || "Not provided" },
      { label: "Serving time", value: cateringServingDisplay || "Not provided" },
      {
        label: "Dietary notes",
        value: input.cateringDietaryNotes?.trim() || "None",
      },
      { label: "Extra notes", value: input.cateringNotes?.trim() || "None" },
    );
  }

  if (input.requesterName || input.requesterEmail) {
    rows.push({
      label: "Requester",
      value: formatPersonLabel(input.requesterName, input.requesterEmail) ?? "Not provided",
    });
  }

  if (input.status) {
    rows.push({ label: "Status", value: input.status });
  }

  if (input.bookingLink) {
    rows.push({ label: "Booking link", value: input.bookingLink });
  }

  return rows;
}

/** Plain-text rendering of detail rows. */
export function detailRowsToText(rows: DetailRow[]): string {
  return rows.map((r) => `${r.label}: ${r.value}`).join("\n");
}

/** HTML rendering of detail rows as <p><strong>label:</strong> value</p> lines. */
export function detailRowsToHtml(rows: DetailRow[]): string {
  return rows
    .map(
      (r) =>
        `<p><strong>${escapeForHtml(r.label)}:</strong> ${escapeForHtml(r.value)}</p>`,
    )
    .join("\n");
}

function escapeForHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
