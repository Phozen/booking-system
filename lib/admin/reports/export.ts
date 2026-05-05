import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingStatus,
  formatBookingWindow,
} from "@/lib/bookings/format";
import { formatFacilityType } from "@/lib/facilities/format";
import type {
  AdminReportsData,
  ReportExportType,
} from "@/lib/admin/reports/types";

type CsvRow = (string | number | boolean | null | undefined)[];

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function toCsv(headers: string[], rows: CsvRow[]) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");
}

function bookingName(row: AdminReportsData["bookingHistory"][number]) {
  return row.user?.fullName || row.user?.email || "Unknown";
}

function facilityName(row: AdminReportsData["bookingHistory"][number]) {
  return row.facility
    ? `${row.facility.name}, ${row.facility.level}`
    : "Unavailable";
}

export function getReportExportLabel(type: ReportExportType) {
  const labels: Record<ReportExportType, string> = {
    "booking-history": "Booking history",
    "facility-utilization": "Facility utilization",
    "user-bookings": "User booking summary",
    "cancelled-bookings": "Cancelled bookings",
    "audit-logs": "Audit logs",
  };

  return labels[type];
}

export function getReportExportSlug(type: ReportExportType) {
  const slugs: Record<ReportExportType, string> = {
    "booking-history": "booking_history",
    "facility-utilization": "facility_utilization",
    "user-bookings": "user_booking_summary",
    "cancelled-bookings": "cancelled_bookings",
    "audit-logs": "audit_logs",
  };

  return slugs[type];
}

export function buildReportCsv(data: AdminReportsData, type: ReportExportType) {
  if (type === "facility-utilization") {
    return {
      rowCount: data.facilityUtilization.length,
      csv: toCsv(
        [
          "Facility code",
          "Facility",
          "Level",
          "Type",
          "Total bookings",
          "Confirmed bookings",
          "Cancelled bookings",
          "Total booked hours",
        ],
        data.facilityUtilization.map((row) => [
          row.code,
          row.facilityName,
          row.level,
          formatFacilityType(row.type),
          row.totalBookings,
          row.confirmedBookings,
          row.cancelledBookings,
          row.totalBookedHours,
        ]),
      ),
    };
  }

  if (type === "user-bookings") {
    return {
      rowCount: data.userBookingSummary.length,
      csv: toCsv(
        [
          "User",
          "Email",
          "Total bookings",
          "Confirmed bookings",
          "Pending bookings",
          "Cancelled bookings",
          "Total booked hours",
        ],
        data.userBookingSummary.map((row) => [
          row.userName,
          row.email,
          row.totalBookings,
          row.confirmedBookings,
          row.pendingBookings,
          row.cancelledBookings,
          row.totalBookedHours,
        ]),
      ),
    };
  }

  if (type === "cancelled-bookings") {
    return {
      rowCount: data.cancelledBookings.length,
      csv: toCsv(
        [
          "Title",
          "Facility",
          "User",
          "Date",
          "Time",
          "Status",
          "Cancelled at",
          "Cancellation reason",
          "Created at",
        ],
        data.cancelledBookings.map((row) => [
          row.title,
          facilityName(row),
          bookingName(row),
          formatBookingDate(row.startsAt),
          formatBookingWindow(row.startsAt, row.endsAt),
          formatBookingStatus(row.status),
          row.cancelledAt ? formatBookingDateTime(row.cancelledAt) : "",
          row.cancellationReason,
          formatBookingDateTime(row.createdAt),
        ]),
      ),
    };
  }

  if (type === "audit-logs") {
    return {
      rowCount: data.auditLogs.length,
      csv: toCsv(
        [
          "Created at",
          "Action",
          "Entity type",
          "Entity id",
          "Actor email",
          "Summary",
        ],
        data.auditLogs.map((row) => [
          formatBookingDateTime(row.createdAt),
          row.action,
          row.entityType,
          row.entityId,
          row.actorEmail,
          row.summary,
        ]),
      ),
    };
  }

  return {
    rowCount: data.bookingHistory.length,
    csv: toCsv(
      [
        "Title",
        "Facility",
        "User",
        "Date",
        "Time",
        "Status",
        "Approval required",
        "Approval status",
        "Attendee count",
        "Created at",
      ],
      data.bookingHistory.map((row) => [
        row.title,
        facilityName(row),
        bookingName(row),
        formatBookingDate(row.startsAt),
        formatBookingWindow(row.startsAt, row.endsAt),
        formatBookingStatus(row.status),
        row.approvalRequired ? "Yes" : "No",
        row.approvalStatus,
        row.attendeeCount,
        formatBookingDateTime(row.createdAt),
      ]),
    ),
  };
}

