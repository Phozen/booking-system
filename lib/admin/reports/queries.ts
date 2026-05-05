import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApprovalStatus, BookingStatus } from "@/lib/bookings/queries";
import type { FacilityType } from "@/lib/facilities/validation";
import type {
  AdminReportsData,
  AuditLogReportRow,
  BookingHistoryRow,
  CancelledBookingRow,
  FacilityUtilizationRow,
  ReportBookingFacility,
  ReportFilters,
  ReportSummary,
  UserBookingSummaryRow,
} from "@/lib/admin/reports/types";

type ReportBookingFacilityRecord =
  | ReportBookingFacility
  | ReportBookingFacility[]
  | null;

type ReportBookingUserRecord =
  | {
      id: string;
      email: string;
      full_name: string | null;
    }
  | {
      id: string;
      email: string;
      full_name: string | null;
    }[]
  | null;

type ReportBookingApprovalRecord = {
  id: string;
  status: ApprovalStatus;
  remarks: string | null;
  requested_at: string;
  reviewed_at: string | null;
};

type ReportBookingRecord = {
  id: string;
  title: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  created_at: string;
  approval_required: boolean;
  attendee_count: number | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  facilities?: ReportBookingFacilityRecord;
  profiles?: ReportBookingUserRecord;
  booking_approvals?: ReportBookingApprovalRecord[] | null;
};

type AuditLogRecord = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_email: string | null;
  summary: string | null;
  created_at: string;
};

export type ReportQueryOptions = {
  bookingLimit?: number;
  auditLimit?: number;
};

const reportBookingSelect = `
  id,
  title,
  status,
  starts_at,
  ends_at,
  created_at,
  approval_required,
  attendee_count,
  cancellation_reason,
  cancelled_at,
  facilities (
    id,
    code,
    name,
    level,
    type
  ),
  profiles!bookings_user_id_fkey (
    id,
    email,
    full_name
  ),
  booking_approvals (
    id,
    status,
    remarks,
    requested_at,
    reviewed_at
  )
`;

function durationHours(startsAt: string, endsAt: string) {
  const durationMs = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(0, durationMs / 3_600_000);
}

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

function mapBookingRecord(record: ReportBookingRecord): BookingHistoryRow {
  const facilityRecord = Array.isArray(record.facilities)
    ? record.facilities[0]
    : record.facilities;
  const userRecord = Array.isArray(record.profiles)
    ? record.profiles[0]
    : record.profiles;
  const approvalRecord = [...(record.booking_approvals ?? [])].sort((a, b) =>
    b.requested_at.localeCompare(a.requested_at),
  )[0];

  return {
    id: record.id,
    title: record.title,
    status: record.status,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    createdAt: record.created_at,
    approvalRequired: record.approval_required,
    attendeeCount: record.attendee_count,
    cancellationReason: record.cancellation_reason,
    cancelledAt: record.cancelled_at,
    facility: facilityRecord
      ? {
          id: facilityRecord.id,
          code: facilityRecord.code,
          name: facilityRecord.name,
          level: facilityRecord.level,
          type: facilityRecord.type,
        }
      : null,
    user: userRecord
      ? {
          id: userRecord.id,
          email: userRecord.email,
          fullName: userRecord.full_name,
        }
      : null,
    approvalStatus: approvalRecord?.status ?? null,
    approvalRemarks: approvalRecord?.remarks ?? null,
  };
}

function buildSummary(bookings: BookingHistoryRow[]): ReportSummary {
  const totalBookedHours = bookings
    .filter(
      (booking) =>
        booking.status === "confirmed" || booking.status === "completed",
    )
    .reduce(
      (total, booking) => total + durationHours(booking.startsAt, booking.endsAt),
      0,
    );

  const facilityCounts = new Map<
    string,
    { facilityName: string; level: string; bookingCount: number }
  >();
  const userCounts = new Map<
    string,
    { userName: string; email: string; bookingCount: number }
  >();

  for (const booking of bookings) {
    if (booking.facility) {
      const key = booking.facility.id;
      const current = facilityCounts.get(key) ?? {
        facilityName: booking.facility.name,
        level: booking.facility.level,
        bookingCount: 0,
      };
      current.bookingCount += 1;
      facilityCounts.set(key, current);
    }

    if (booking.user) {
      const key = booking.user.id;
      const current = userCounts.get(key) ?? {
        userName: booking.user.fullName || booking.user.email,
        email: booking.user.email,
        bookingCount: 0,
      };
      current.bookingCount += 1;
      userCounts.set(key, current);
    }
  }

  return {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter((item) => item.status === "confirmed")
      .length,
    cancelledBookings: bookings.filter((item) => item.status === "cancelled")
      .length,
    rejectedBookings: bookings.filter((item) => item.status === "rejected")
      .length,
    pendingBookings: bookings.filter((item) => item.status === "pending").length,
    totalBookedHours: roundHours(totalBookedHours),
    mostBookedFacilities: [...facilityCounts.values()]
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5),
    mostActiveUsers: [...userCounts.values()]
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5),
  };
}

function buildFacilityUtilization(
  bookings: BookingHistoryRow[],
): FacilityUtilizationRow[] {
  const rows = new Map<string, FacilityUtilizationRow>();

  for (const booking of bookings) {
    if (!booking.facility) {
      continue;
    }

    const row = rows.get(booking.facility.id) ?? {
      facilityId: booking.facility.id,
      code: booking.facility.code,
      facilityName: booking.facility.name,
      level: booking.facility.level,
      type: booking.facility.type as FacilityType,
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      totalBookedHours: 0,
    };

    row.totalBookings += 1;
    if (booking.status === "confirmed" || booking.status === "completed") {
      row.confirmedBookings += 1;
      row.totalBookedHours += durationHours(booking.startsAt, booking.endsAt);
    }
    if (booking.status === "cancelled") {
      row.cancelledBookings += 1;
    }

    rows.set(booking.facility.id, row);
  }

  return [...rows.values()]
    .map((row) => ({ ...row, totalBookedHours: roundHours(row.totalBookedHours) }))
    .sort((a, b) => b.totalBookedHours - a.totalBookedHours);
}

function buildUserSummary(bookings: BookingHistoryRow[]): UserBookingSummaryRow[] {
  const rows = new Map<string, UserBookingSummaryRow>();

  for (const booking of bookings) {
    if (!booking.user) {
      continue;
    }

    const row = rows.get(booking.user.id) ?? {
      userId: booking.user.id,
      userName: booking.user.fullName || booking.user.email,
      email: booking.user.email,
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      pendingBookings: 0,
      totalBookedHours: 0,
    };

    row.totalBookings += 1;
    if (booking.status === "confirmed" || booking.status === "completed") {
      row.confirmedBookings += 1;
      row.totalBookedHours += durationHours(booking.startsAt, booking.endsAt);
    }
    if (booking.status === "cancelled") {
      row.cancelledBookings += 1;
    }
    if (booking.status === "pending") {
      row.pendingBookings += 1;
    }

    rows.set(booking.user.id, row);
  }

  return [...rows.values()]
    .map((row) => ({ ...row, totalBookedHours: roundHours(row.totalBookedHours) }))
    .sort((a, b) => b.totalBookings - a.totalBookings);
}

function mapAuditLog(record: AuditLogRecord): AuditLogReportRow {
  return {
    id: record.id,
    action: record.action,
    entityType: record.entity_type,
    entityId: record.entity_id,
    actorEmail: record.actor_email,
    summary: record.summary,
    createdAt: record.created_at,
  };
}

export async function getReportBookings(
  supabase: SupabaseClient,
  filters: ReportFilters,
  limit = 500,
) {
  let query = supabase
    .from("bookings")
    .select(reportBookingSelect)
    .gte("starts_at", filters.dateFromIso)
    .lt("starts_at", filters.dateToExclusiveIso)
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (filters.facilityId) {
    query = query.eq("facility_id", filters.facilityId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load booking report data.");
  }

  return ((data as unknown as ReportBookingRecord[] | null) ?? []).map(
    mapBookingRecord,
  );
}

export async function getAuditLogReportRows(
  supabase: SupabaseClient,
  filters: ReportFilters,
  limit = 250,
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, actor_email, summary, created_at")
    .gte("created_at", filters.dateFromIso)
    .lt("created_at", filters.dateToExclusiveIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Unable to load audit log report data.");
  }

  return ((data as unknown as AuditLogRecord[] | null) ?? []).map(mapAuditLog);
}

export async function getAdminReportsData(
  supabase: SupabaseClient,
  filters: ReportFilters,
  options: ReportQueryOptions = {},
): Promise<AdminReportsData> {
  const bookingHistory = await getReportBookings(
    supabase,
    filters,
    options.bookingLimit ?? 500,
  );
  const auditLogs = await getAuditLogReportRows(
    supabase,
    filters,
    options.auditLimit ?? 250,
  );

  return {
    filters,
    summary: buildSummary(bookingHistory),
    bookingHistory,
    facilityUtilization: buildFacilityUtilization(bookingHistory),
    userBookingSummary: buildUserSummary(bookingHistory),
    cancelledBookings: bookingHistory.filter(
      (booking): booking is CancelledBookingRow => booking.status === "cancelled",
    ),
    auditLogs,
  };
}
