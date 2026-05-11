import { formatBookingDate, formatBookingTime } from "@/lib/bookings/format";
import type {
  EmailNotificationType,
  EmailTemplateInput,
  RenderedEmailTemplate,
} from "@/lib/email/types";

function getStringValue(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

function renderHtml({
  title,
  intro,
  rows,
  link,
}: {
  title: string;
  intro: string;
  rows: { label: string; value: string | null }[];
  link: string;
}) {
  const details = rows
    .filter((row) => row.value)
    .map(
      (row) => `
        <tr>
          <td style="padding: 6px 12px 6px 0; color: #475569; font-weight: 600;">${escapeHtml(row.label)}</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(row.value ?? "")}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h1 style="font-size: 20px; margin: 0 0 12px;">${escapeHtml(title)}</h1>
      <p style="margin: 0 0 16px;">${escapeHtml(intro)}</p>
      <table style="border-collapse: collapse; margin: 0 0 18px;">
        <tbody>${details}</tbody>
      </table>
      <p style="margin: 0;">
        <a href="${escapeHtml(link)}" style="color: #2563eb;">View booking details</a>
      </p>
    </div>
  `;
}

function renderText({
  title,
  intro,
  rows,
  link,
}: {
  title: string;
  intro: string;
  rows: { label: string; value: string | null }[];
  link: string;
}) {
  const details = rows
    .filter((row) => row.value)
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");

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
  const link = getBookingLink(input.appUrl, bookingId);
  const bookingDate = startsAt ? formatBookingDate(startsAt) : null;
  const startTime = startsAt ? formatBookingTime(startsAt) : null;
  const endTime = endsAt ? formatBookingTime(endsAt) : null;

  const rows = [
    { label: "Booking title", value: title },
    { label: "Facility", value: facilityName },
    { label: "Level", value: facilityLevel },
    { label: "Date", value: bookingDate },
    { label: "Start time", value: startTime },
    { label: "End time", value: endTime },
    { label: "Status", value: status },
    { label: "Invitation status", value: invitationStatus },
    { label: "Responded by", value: actorName ?? actorEmail },
    { label: "Rejection reason", value: rejectionReason },
    { label: "Cancellation reason", value: cancellationReason },
  ];

  const introByType: Record<EmailNotificationType, string> = {
    booking_confirmation: "Your booking has been confirmed.",
    booking_approval: "Your booking has been approved.",
    booking_rejection: "Your booking has been rejected.",
    booking_cancellation: "Your booking has been cancelled.",
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
    booking_reminder: `Booking reminder: ${title}`,
    booking_invitation: `Booking invitation: ${title}`,
    booking_invitation_accepted: `Invitation accepted: ${title}`,
    booking_invitation_declined: `Invitation declined: ${title}`,
  };
  const heading = headingByType[input.type];
  const intro = input.body || introByType[input.type];

  return {
    subject: input.subject || heading,
    html: renderHtml({ title: heading, intro, rows, link }),
    text: renderText({ title: heading, intro, rows, link }),
  };
}
