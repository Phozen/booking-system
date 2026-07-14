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
          <td style="width: 38%; padding: 8px 14px 8px 0; color: #475569; font-size: 12px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; vertical-align: top;">${escapeHtml(row.label)}</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; vertical-align: top;">${escapeHtml(row.value ?? "")}</td>
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
        <section style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 0 0 14px; background: #ffffff;">
          <h2 style="font-size: 16px; margin: 0 0 12px; color: #0f172a;">${escapeHtml(section.title)}</h2>
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tbody>${renderSectionRows(section.rows)}</tbody>
          </table>
        </section>
      `,
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5; background: #f8fafc; padding: 24px;">
      <div style="max-width: 720px; margin: 0 auto;">
        <header style="border-bottom: 1px solid #cbd5e1; padding: 0 0 18px; margin: 0 0 18px;">
          <div style="font-size: 28px; font-weight: 800; color: #047857; letter-spacing: -0.02em;">QBook</div>
          <div style="font-size: 12px; color: #64748b; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;">Qhazanah Sabah Berhad</div>
          <h1 style="font-size: 22px; margin: 16px 0 8px; color: #0f172a;">${escapeHtml(title)}</h1>
          <p style="margin: 0; color: #475569;">${escapeHtml(intro)}</p>
        </header>
        ${detailSections}
        <p style="margin: 18px 0 0;">
          <a href="${escapeHtml(link)}" style="display: inline-block; border-radius: 8px; background: #2563eb; color: #ffffff; font-weight: 700; padding: 10px 14px; text-decoration: none;">View booking details</a>
        </p>
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
  const facilityName =
    getStringValue(input.templateData, "facilityName") ?? "Facility";
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
  const link = getBookingLink(input.appUrl, bookingId);
  const bookingDate = startsAt ? formatBookingDate(startsAt) : null;
  const startTime = startsAt ? formatBookingTime(startsAt) : null;
  const endTime = endsAt ? formatBookingTime(endsAt) : null;
  const bookingTime =
    startsAt && endsAt ? formatBookingWindow(startsAt, endsAt) : null;

  const sections: EmailDetailSection[] = [
    {
      title: "Meeting details",
      rows: [
        { label: "Booking title", value: title },
        { label: "Facility", value: facilityName },
        { label: "Level", value: facilityLevel },
        { label: "Date", value: bookingDate },
        { label: "Time", value: bookingTime ?? [startTime, endTime].filter(Boolean).join(" - ") },
        { label: "Start time", value: startTime },
        { label: "End time", value: endTime },
        { label: "Status", value: status },
        { label: "Attendee count", value: attendeeCount },
      ],
    },
    {
      title: "Requester / invitation details",
      rows: [
        { label: "Requester", value: requesterName ?? requesterEmail },
        { label: "Invitation status", value: invitationStatus },
        { label: "Responded by", value: actorName ?? actorEmail },
      ],
    },
    {
      title: "Food & drinks / catering",
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
      title: "Outcome notes",
      rows: [
        { label: "Rejection reason", value: rejectionReason },
        { label: "Cancellation reason", value: cancellationReason },
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
