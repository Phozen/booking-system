import {
  formatBookingDate,
  formatBookingTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import {
  formatCateringServingTime,
  formatCateringType,
} from "@/lib/bookings/catering/format";
import type {
  EmailNotificationType,
  EmailTemplateInput,
  RenderedEmailTemplate,
} from "@/lib/email/types";

function getStringValue(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getDisplayValue(data: Record<string, unknown>, key: string) {
  const value = data[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return getStringValue(data, key);
}

function getDepartmentDisplayValue(data: Record<string, unknown>) {
  const departments = data.departments;

  if (!Array.isArray(departments)) {
    return null;
  }

  const labels = departments.flatMap((department) => {
    if (!department || typeof department !== "object") {
      return [];
    }

    const values = department as Record<string, unknown>;
    const name = getStringValue(values, "name");
    const email = getStringValue(values, "email");

    if (!name && !email) {
      return [];
    }

    return [name && email ? `${name} (${email})` : name ?? email!];
  });

  return labels.length > 0 ? labels.join(", ") : null;
}

function getBookingLink(appUrl: string, bookingId: string | null) {
  const baseUrl = appUrl.replace(/\/$/, "");
  return bookingId ? `${baseUrl}/bookings/${bookingId}` : baseUrl;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type EmailDetailRow = { label: string; value: string | null };
type EmailDetailSection = { title: string; rows: EmailDetailRow[] };

function hasRows(section: EmailDetailSection) {
  return section.rows.some((row) => row.value);
}

function renderSectionRows(rows: EmailDetailRow[]) {
  return rows
    .filter((row) => row.value)
    .map(
      (row) => `
        <tr>
          <th scope="row" style="width: 38%; padding: 9px 16px 9px 0; color: #475569; font-size: 13px; font-weight: 600; line-height: 1.45; text-align: left; vertical-align: top;">${escapeHtml(row.label)}</th>
          <td style="padding: 9px 0; color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.45; vertical-align: top;">${escapeHtml(row.value ?? "")}</td>
        </tr>
      `,
    )
    .join("");
}

function renderHtml({
  title,
  intro,
  sections,
  link,
}: {
  title: string;
  intro: string;
  sections: EmailDetailSection[];
  link: string;
}) {
  const detailSections = sections
    .filter(hasRows)
    .map(
      (section) => `
        <section style="margin: 0 0 16px; padding: 20px; border: 1px solid #dbe3ef; border-radius: 12px; background: #ffffff;">
          <h2 style="margin: 0 0 10px; color: #1e293b; font-size: 16px; line-height: 1.35;">${escapeHtml(section.title)}</h2>
          <table style="width: 100%; border-collapse: collapse;" aria-label="${escapeHtml(section.title)}">
            <tbody>${renderSectionRows(section.rows)}</tbody>
          </table>
        </section>
      `,
    )
    .join("");

  return `
    <div role="article" aria-roledescription="email" aria-label="QBook booking update" style="margin: 0; padding: 32px 16px; background: #f1f5f9; color: #0f172a; font-family: Arial, Helvetica, sans-serif; line-height: 1.5;">
      <div style="max-width: 640px; margin: 0 auto;">
        <header style="overflow: hidden; margin: 0 0 16px; border-radius: 14px; background: #064e3b; color: #ffffff;">
          <div style="padding: 24px 24px 22px;">
            <p style="margin: 0 0 10px; color: #d1fae5; font-size: 13px; font-weight: 700; letter-spacing: .04em;">QBOOK</p>
            <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 24px; line-height: 1.25;">${escapeHtml(title)}</h1>
            <p style="margin: 0; color: #ecfdf5; font-size: 15px; line-height: 1.55;">${escapeHtml(intro)}</p>
          </div>
        </header>
        <main>
          ${detailSections}
          <p style="margin: 24px 0 12px;">
            <a href="${escapeHtml(link)}" style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #1d4ed8; color: #ffffff; font-size: 15px; font-weight: 700; line-height: 1.2; text-decoration: none;">View booking</a>
          </p>
        </main>
        <footer style="padding: 4px 4px 0; color: #64748b; font-size: 12px; line-height: 1.5;">
          QBook &middot; Qhazanah Sabah Berhad
        </footer>
      </div>
    </div>
  `;
}

function renderText({
  title,
  intro,
  sections,
  link,
}: {
  title: string;
  intro: string;
  sections: EmailDetailSection[];
  link: string;
}) {
  const details = sections
    .filter(hasRows)
    .map((section) => {
      const rows = section.rows
        .filter((row) => row.value)
        .map((row) => `${row.label}: ${row.value}`)
        .join("\n");

      return `${section.title}\n${rows}`;
    })
    .join("\n\n");

  return `${title}\n\n${intro}\n\n${details}\n\nView booking details: ${link}`;
}

export function renderEmailTemplate(
  input: EmailTemplateInput,
): RenderedEmailTemplate {
  const bookingId = getStringValue(input.templateData, "bookingId");
  const title = getStringValue(input.templateData, "title") ?? "Booking";
  const facilityName = getStringValue(input.templateData, "facilityName");
  const facilityLevel = getStringValue(input.templateData, "facilityLevel");
  const startsAt = getStringValue(input.templateData, "startsAt");
  const endsAt = getStringValue(input.templateData, "endsAt");
  const attendeeCount = getDisplayValue(input.templateData, "attendeeCount");
  const status = getStringValue(input.templateData, "status");
  const rejectionReason =
    getStringValue(input.templateData, "rejectionReason") ??
    getStringValue(input.templateData, "remarks");
  const cancellationReason = getStringValue(
    input.templateData,
    "cancellationReason",
  );
  const invitationStatus = getStringValue(input.templateData, "invitationStatus");
  const actorName = getStringValue(input.templateData, "actorName");
  const actorEmail = getStringValue(input.templateData, "actorEmail");
  const requesterName = getStringValue(input.templateData, "requesterName");
  const requesterEmail = getStringValue(input.templateData, "requesterEmail");
  const cateringType = getStringValue(input.templateData, "cateringType");
  const cateringPax = getDisplayValue(input.templateData, "cateringPax");
  const cateringServingTime = getStringValue(
    input.templateData,
    "cateringServingTime",
  );
  const cateringDietaryNotes = getStringValue(
    input.templateData,
    "cateringDietaryNotes",
  );
  const cateringNotes = getStringValue(input.templateData, "cateringNotes");
  const departments = getDepartmentDisplayValue(input.templateData);
  const link = getBookingLink(input.appUrl, bookingId);
  const bookingDate = startsAt ? formatBookingDate(startsAt) : null;
  const startTime = startsAt ? formatBookingTime(startsAt) : null;
  const endTime = endsAt ? formatBookingTime(endsAt) : null;
  const bookingTime =
    startsAt && endsAt ? formatBookingWindow(startsAt, endsAt) : null;
  const facility = [facilityName, facilityLevel].filter(Boolean).join(" · ") || null;

  const sections: EmailDetailSection[] = [
    {
      title: "Meeting details",
      rows: [
        { label: "Facility", value: facility },
        { label: "Date", value: bookingDate },
        {
          label: "Time",
          value: bookingTime ?? [startTime, endTime].filter(Boolean).join(" - "),
        },
        { label: "Status", value: status },
        { label: "Attendees", value: attendeeCount },
      ],
    },
    {
      title: "Departments",
      rows: [{ label: "Included", value: departments }],
    },
    {
      title: "People",
      rows: [
        { label: "Requester", value: requesterName ?? requesterEmail },
        { label: "Invitation status", value: invitationStatus },
        { label: "Responded by", value: actorName ?? actorEmail },
      ],
    },
    {
      title: "Catering",
      rows: [
        {
          label: "Catering type",
          value: cateringType ? formatCateringType(cateringType) : null,
        },
        { label: "Catering pax", value: cateringPax },
        {
          label: "Serving time",
          value: cateringServingTime
            ? formatCateringServingTime(cateringServingTime)
            : null,
        },
        { label: "Dietary notes", value: cateringDietaryNotes },
        { label: "Notes", value: cateringNotes },
      ],
    },
    {
      title: "Notes",
      rows: [
        { label: "Reason", value: rejectionReason ?? cancellationReason },
      ],
    },
  ];

  const introByType: Record<EmailNotificationType, string> = {
    booking_confirmation: "Your booking has been confirmed.",
    booking_approval: "Your booking has been approved.",
    booking_rejection: "Your booking has been rejected.",
    booking_cancellation: "Your booking has been cancelled.",
    booking_catering_request: "A booking was created with catering requested.",
    booking_reminder: "This is a reminder for your upcoming booking.",
    booking_invitation: "You have been invited to a booking.",
    booking_invitation_accepted: "A booking invitation has been accepted.",
    booking_invitation_declined: "A booking invitation has been declined.",
  };

  const headingByType: Record<EmailNotificationType, string> = {
    booking_confirmation: `Booking confirmed: ${title}`,
    booking_approval: `Booking approved: ${title}`,
    booking_rejection: `Booking rejected: ${title}`,
    booking_cancellation: `Booking cancelled: ${title}`,
    booking_catering_request: `Catering requested: ${title}`,
    booking_reminder: `Booking reminder: ${title}`,
    booking_invitation: `Booking invitation: ${title}`,
    booking_invitation_accepted: `Invitation accepted: ${title}`,
    booking_invitation_declined: `Invitation declined: ${title}`,
  };
  const heading = headingByType[input.type];
  const intro = input.body || introByType[input.type];

  return {
    subject: input.subject || heading,
    html: renderHtml({ title: heading, intro, sections, link }),
    text: renderText({ title: heading, intro, sections, link }),
  };
}
