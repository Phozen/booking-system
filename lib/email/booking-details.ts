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

  const bookingRows: DetailRow[] = [
    { label: "Room", value: facility || "Not provided" },
    { label: "Date", value: date || "Not provided" },
    { label: "Time", value: time || "Not provided" },
    { label: "Purpose", value: input.title?.trim() || "Not provided" },
    { label: "Description", value: input.description?.trim() || "None" },
    { label: "Meeting type", value: meetingType || "Not provided" },
  ];

  if (input.status) {
    bookingRows.push({ label: "Status", value: input.status });
  }

  const peopleRows: DetailRow[] = [
    {
      label: "Headcount",
      value:
        input.attendeeCount != null && input.attendeeCount !== ""
          ? String(input.attendeeCount)
          : "Not provided",
    },
    { label: "Attendees", value: inviteeDisplay || "None" },
    { label: "Departments", value: departmentDisplay || "None" },
  ];

  if (input.requesterName || input.requesterEmail) {
    peopleRows.push({
      label: "Booked by",
      value: formatPersonLabel(input.requesterName, input.requesterEmail) ?? "Not provided",
    });
  }

  const cateringRows: DetailRow[] = [
    { label: "Catering", value: cateringLabel },
  ];

  if (input.cateringRequired) {
    cateringRows.push(
      { label: "Catering type", value: cateringTypeDisplay || "Not provided" },
      { label: "Catering pax", value: cateringPaxDisplay || "Not provided" },
      { label: "Serving time", value: cateringServingDisplay || "Not provided" },
      {
        label: "Dietary notes",
        value: input.cateringDietaryNotes?.trim() || "None",
      },
    );
  }

  const rows: DetailRow[] = [...bookingRows, ...peopleRows, ...cateringRows];

  if (input.bookingLink) {
    rows.push({ label: "Booking link", value: input.bookingLink });
  }

  return rows;
}

export type DetailSection = { heading: string; rows: DetailRow[] };

/**
 * Builds sectioned booking details for richer output (Outlook, emails).
 */
export function buildBookingDetailSections(input: BookingDetailInput): DetailSection[] {
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

  const sections: DetailSection[] = [];

  const bookingRows: DetailRow[] = [
    { label: "Room", value: facility || "Not provided" },
    { label: "Date", value: date || "Not provided" },
    { label: "Time", value: time || "Not provided" },
    { label: "Purpose", value: input.title?.trim() || "Not provided" },
    { label: "Description", value: input.description?.trim() || "None" },
    { label: "Meeting type", value: meetingType || "Not provided" },
  ];
  if (input.status) {
    bookingRows.push({ label: "Status", value: input.status });
  }
  sections.push({ heading: "Booking", rows: bookingRows });

  const peopleRows: DetailRow[] = [
    {
      label: "Headcount",
      value:
        input.attendeeCount != null && input.attendeeCount !== ""
          ? String(input.attendeeCount)
          : "Not provided",
    },
    { label: "Attendees", value: inviteeDisplay || "None" },
    { label: "Departments", value: departmentDisplay || "None" },
  ];
  if (input.requesterName || input.requesterEmail) {
    peopleRows.push({
      label: "Booked by",
      value: formatPersonLabel(input.requesterName, input.requesterEmail) ?? "Not provided",
    });
  }
  sections.push({ heading: "People", rows: peopleRows });

  const cateringRows: DetailRow[] = [
    { label: "Catering", value: cateringLabel },
  ];
  if (input.cateringRequired) {
    cateringRows.push(
      { label: "Catering type", value: cateringTypeDisplay || "Not provided" },
      { label: "Catering pax", value: cateringPaxDisplay || "Not provided" },
      { label: "Serving time", value: cateringServingDisplay || "Not provided" },
      {
        label: "Dietary notes",
        value: input.cateringDietaryNotes?.trim() || "None",
      },
    );
  }
  sections.push({ heading: "Catering", rows: cateringRows });

  if (input.bookingLink) {
    sections.push({
      heading: "Reference",
      rows: [{ label: "Booking link", value: input.bookingLink }],
    });
  }

  return sections;
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

/** Plain-text rendering of sectioned details. */
export function detailSectionsToText(sections: DetailSection[]): string {
  return sections
    .map((s) => `${s.heading}\n${s.rows.map((r) => `  ${r.label}: ${r.value}`).join("\n")}`)
    .join("\n\n");
}

function renderDetailSectionRowsHtml(rows: DetailRow[]) {
  return rows
    .map(
      (row) => `
        <tr>
          <th scope="row" style="width: 34%; padding: 7px 14px 7px 0; color: #64748b; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; line-height: 1.45; text-align: left; vertical-align: top;">${escapeForHtml(row.label)}</th>
          <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 500; line-height: 1.5; vertical-align: top; white-space: pre-wrap;">${escapeForHtml(row.value).replaceAll("\n", "<br>")}</td>
        </tr>
      `,
    )
    .join("");
}

/** HTML rendering of sectioned details with email-style category cards. */
export function detailSectionsToHtml(sections: DetailSection[]): string {
  return sections
    .map(
      (section) => `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin: 0 0 14px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
          <tr>
            <td style="padding: 14px 16px 12px;">
              <p style="margin: 0 0 10px; color: #0f172a; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">${escapeForHtml(section.heading)}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;" aria-label="${escapeForHtml(section.heading)}">
                <tbody>${renderDetailSectionRowsHtml(section.rows)}</tbody>
              </table>
            </td>
          </tr>
        </table>
      `,
    )
    .join("\n");
}

function getPublicAssetUrl(appUrl: string | null | undefined, path: string) {
  const baseUrl = appUrl?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Branded booking details HTML shared by QBook emails and Outlook event bodies.
 * Includes Qhazanah + QBook logos when appUrl is available.
 */
export function buildBrandedBookingDetailsHtml({
  sections,
  appUrl,
  intro = "Facility booking via QBook",
  bookingLink,
}: {
  sections: DetailSection[];
  appUrl?: string | null;
  intro?: string | null;
  bookingLink?: string | null;
}): string {
  const companyLogoUrl = getPublicAssetUrl(appUrl, "/company-logo.png");
  const qbookLogoUrl = getPublicAssetUrl(appUrl, "/qbook-logo.png");

  const logoHeader =
    companyLogoUrl && qbookLogoUrl
      ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin: 0 0 16px; border-bottom: 1px solid #e2e8f0;">
          <tr>
            <td align="left" valign="middle" style="padding: 0 0 14px;">
              <img src="${escapeForHtml(companyLogoUrl)}" alt="Qhazanah Sabah Berhad" width="132" style="display: block; width: 132px; max-width: 40%; height: auto; border: 0;" />
            </td>
            <td align="right" valign="middle" style="padding: 0 0 14px;">
              <img src="${escapeForHtml(qbookLogoUrl)}" alt="QBook" width="120" style="display: block; width: 120px; max-width: 38%; height: auto; border: 0; margin-left: auto;" />
            </td>
          </tr>
        </table>
      `
      : "";

  const introHtml = intro?.trim()
    ? `<p style="margin: 0 0 14px; color: #475569; font-size: 14px; line-height: 1.55;">${escapeForHtml(intro.trim())}</p>`
    : "";

  const linkHtml = bookingLink?.trim()
    ? `<p style="margin: 16px 0 0;"><a href="${escapeForHtml(bookingLink.trim())}" style="display: inline-block; padding: 10px 16px; border-radius: 6px; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.2; text-decoration: none;">Open booking</a></p>`
    : "";

  return `
    <div style="color: #0f172a; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; line-height: 1.5;">
      ${logoHeader}
      ${introHtml}
      ${detailSectionsToHtml(sections)}
      ${linkHtml}
    </div>
  `.trim();
}

function escapeForHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
