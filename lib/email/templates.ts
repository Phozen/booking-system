import {
  formatBookingStatus,
} from "@/lib/bookings/format";
import type { BookingStatus } from "@/lib/bookings/queries";
import {
  buildBookingDetailSections,
  formatInviteeList,
  formatPersonLabel,
} from "@/lib/email/booking-details";
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

function getInviteeDisplayValue(data: Record<string, unknown>) {
  const invitees = data.invitees;

  if (typeof invitees === "string" && invitees.trim()) {
    return invitees.trim();
  }

  if (!Array.isArray(invitees)) {
    return null;
  }

  return formatInviteeList(
    invitees.flatMap((invitee) => {
      if (!invitee || typeof invitee !== "object") {
        return [];
      }

      const values = invitee as Record<string, unknown>;
      return [
        {
          name: getStringValue(values, "name") ?? getStringValue(values, "fullName"),
          email: getStringValue(values, "email"),
        },
      ];
    }),
  );
}

function getBookingLink(appUrl: string, bookingId: string | null) {
  const baseUrl = appUrl.replace(/\/$/, "");
  return bookingId ? `${baseUrl}/bookings/${bookingId}` : baseUrl;
}

function getCalendarEventLink(appUrl: string, calendarEventPath: string | null) {
  if (!calendarEventPath || !calendarEventPath.startsWith("/") || calendarEventPath.startsWith("//")) {
    return null;
  }

  return `${appUrl.replace(/\/$/, "")}${calendarEventPath}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatStatusLabel(status: string | null) {
  if (!status) {
    return null;
  }

  const known: BookingStatus[] = [
    "pending",
    "confirmed",
    "rejected",
    "cancelled",
    "completed",
    "expired",
  ];

  if (known.includes(status as BookingStatus)) {
    return formatBookingStatus(status as BookingStatus);
  }

  return status;
}

type EmailDetailRow = { label: string; value: string | null };
type EmailDetailSection = { title: string; rows: EmailDetailRow[] };

function getAssetUrl(appUrl: string, path: string) {
  const baseUrl = appUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function hasRows(section: EmailDetailSection) {
  return section.rows.some((row) => row.value);
}

function renderSectionRows(rows: EmailDetailRow[]) {
  return rows
    .filter((row) => row.value)
    .map(
      (row) => `
        <tr>
          <th scope="row" style="width: 34%; padding: 7px 14px 7px 0; color: #64748b; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; line-height: 1.45; text-align: left; vertical-align: top;">${escapeHtml(row.label)}</th>
          <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 500; line-height: 1.5; vertical-align: top; white-space: pre-wrap;">${escapeHtml(row.value ?? "").replaceAll("\n", "<br>")}</td>
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
  calendarLink,
  companyLogoUrl,
  qbookLogoUrl,
}: {
  title: string;
  intro: string;
  sections: EmailDetailSection[];
  link: string;
  calendarLink: string | null;
  companyLogoUrl: string;
  qbookLogoUrl: string;
}) {
  const detailSections = sections
    .filter(hasRows)
    .map(
      (section) => `
        <tr>
          <td style="padding: 0 0 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
              <tr>
                <td style="padding: 14px 16px 12px;">
                  <p style="margin: 0 0 10px; color: #0f172a; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">${escapeHtml(section.title)}</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;" aria-label="${escapeHtml(section.title)}">
                    <tbody>${renderSectionRows(section.rows)}</tbody>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join("");

  const calendarCta = calendarLink
    ? `<td style="padding: 0 0 0 10px;"><a href="${escapeHtml(calendarLink)}" style="display: inline-block; padding: 11px 18px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.2; text-decoration: none;">View calendar</a></td>`
    : "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; color: #0f172a; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; line-height: 1.5;">
      <tr><td align="center" style="padding: 28px 16px;">
        <table role="article" aria-roledescription="email" aria-label="QBook booking notice" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <tr>
            <td style="padding: 0; background-color: #0f172a; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 22px 28px 18px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td align="left" valign="middle" style="padding: 0;">
                    <img src="${escapeHtml(companyLogoUrl)}" alt="Qhazanah Sabah Berhad" width="132" style="display: block; width: 132px; max-width: 40%; height: auto; border: 0;" />
                  </td>
                  <td align="right" valign="middle" style="padding: 0;">
                    <img src="${escapeHtml(qbookLogoUrl)}" alt="QBook" width="120" style="display: block; width: 120px; max-width: 38%; height: auto; border: 0; margin-left: auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px 16px; background-color: #ffffff;">
              <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 22px; font-weight: 700; line-height: 1.3;">${escapeHtml(title)}</h1>
              <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.55;">${escapeHtml(intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 28px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">${detailSections}</table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 28px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td>
                    <a href="${escapeHtml(link)}" style="display: inline-block; padding: 11px 18px; border-radius: 6px; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.2; text-decoration: none;">Open booking</a>
                  </td>
                  ${calendarCta}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 28px; border-top: 1px solid #e2e8f0; background-color: #f8fafc; color: #64748b; font-size: 12px; line-height: 1.5;">
              This message was sent by QBook for Qhazanah Sabah Berhad. Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  `;
}

function renderText({
  title,
  intro,
  sections,
  link,
  calendarLink,
}: {
  title: string;
  intro: string;
  sections: EmailDetailSection[];
  link: string;
  calendarLink: string | null;
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

  const calendarText = calendarLink ? `\nView calendar: ${calendarLink}` : "";

  return `${title}\n\n${intro}\n\n${details}\n\nOpen booking: ${link}${calendarText}\n\nQBook · Qhazanah Sabah Berhad`;
}

const invitationResponseTypes = new Set<EmailNotificationType>([
  "booking_invitation",
  "booking_invitation_accepted",
  "booking_invitation_declined",
]);

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
  const status = formatStatusLabel(getStringValue(input.templateData, "status"));
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
  const description = getStringValue(input.templateData, "description");
  const invitees = getInviteeDisplayValue(input.templateData);
  const departments = getDepartmentDisplayValue(input.templateData);
  const link = getBookingLink(input.appUrl, bookingId);
  const calendarLink = getCalendarEventLink(
    input.appUrl,
    getStringValue(input.templateData, "calendarEventPath"),
  );

  const cateringRequired = Boolean(
    cateringType || cateringPax || cateringServingTime || cateringDietaryNotes,
  );

  const detailSections = buildBookingDetailSections({
    facilityName: facilityName,
    facilityLevel: facilityLevel,
    startsAt: startsAt,
    endsAt: endsAt,
    title: title,
    description: description,
    attendeeCount: attendeeCount,
    invitees: invitees,
    departments: departments,
    teamsMeeting: input.templateData.teamsMeeting,
    cateringRequired,
    cateringType: cateringType,
    cateringPax: cateringPax ? Number(cateringPax) : null,
    cateringServingTime: cateringServingTime,
    cateringDietaryNotes: cateringDietaryNotes,
    requesterName: requesterName,
    requesterEmail: requesterEmail,
    status: status,
    bookingLink: null,
  });

  const sections: EmailDetailSection[] = detailSections.map((section) => ({
    title: section.heading,
    rows: section.rows.map((row) => ({ label: row.label, value: row.value })),
  }));

  if (invitationResponseTypes.has(input.type)) {
    sections.push({
      title: "Response",
      rows: [
        { label: "Invitation status", value: invitationStatus },
        { label: "Responded by", value: formatPersonLabel(actorName, actorEmail) },
      ],
    });
  }

  const noteValue = rejectionReason ?? cancellationReason;
  if (noteValue) {
    sections.push({
      title: "Notes",
      rows: [{ label: "Reason", value: noteValue }],
    });
  }

  const companyLogoUrl = getAssetUrl(input.appUrl, "/company-logo.png");
  const qbookLogoUrl = getAssetUrl(input.appUrl, "/qbook-logo.png");

  const introByType: Record<EmailNotificationType, string> = {
    booking_confirmation:
      "Your facility booking has been confirmed. Please review the details below.",
    booking_approval:
      "Your booking request has been approved and is now confirmed.",
    booking_approval_request:
      "A booking request requires your review and approval.",
    booking_pending:
      "Your booking request was submitted and is waiting for approval.",
    booking_rejection:
      "Your booking request was not approved. See the reason below if provided.",
    booking_cancellation:
      "This booking has been cancelled. The reserved time is no longer held.",
    booking_catering_request:
      "Catering has been requested for the booking below. Please arrange service as required.",
    booking_reminder:
      "Reminder: you have an upcoming facility booking. Please arrive on time.",
    booking_invitation:
      "You have been added as an attendee for the booking below.",
    booking_invitation_accepted:
      "An attendee response was recorded for this booking.",
    booking_invitation_declined:
      "An attendee declined participation for this booking.",
  };

  const headingByType: Record<EmailNotificationType, string> = {
    booking_confirmation: `Booking confirmed — ${title}`,
    booking_approval: `Booking approved — ${title}`,
    booking_approval_request: `Approval required — ${title}`,
    booking_pending: `Booking submitted — ${title}`,
    booking_rejection: `Booking not approved — ${title}`,
    booking_cancellation: `Booking cancelled — ${title}`,
    booking_catering_request: `Catering request — ${title}`,
    booking_reminder: `Booking reminder — ${title}`,
    booking_invitation: `Attendee notice — ${title}`,
    booking_invitation_accepted: `Attendee accepted — ${title}`,
    booking_invitation_declined: `Attendee declined — ${title}`,
  };
  const heading = headingByType[input.type];
  const intro = input.body || introByType[input.type];

  return {
    subject: input.subject || heading.replace(" — ", ": "),
    html: renderHtml({
      title: heading,
      intro,
      sections,
      link,
      calendarLink,
      companyLogoUrl,
      qbookLogoUrl,
    }),
    text: renderText({ title: heading, intro, sections, link, calendarLink }),
  };
}
