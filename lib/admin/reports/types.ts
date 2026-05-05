import type { ApprovalStatus, BookingStatus } from "@/lib/bookings/queries";
import type { FacilityType } from "@/lib/facilities/validation";

export type ReportFilters = {
  dateFrom: string;
  dateTo: string;
  dateFromIso: string;
  dateToExclusiveIso: string;
  facilityId?: string;
  status?: BookingStatus;
};

export type ReportFilterInput = {
  dateFrom?: string | string[];
  dateTo?: string | string[];
  facilityId?: string | string[];
  status?: string | string[];
};

export type ReportSummary = {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  rejectedBookings: number;
  pendingBookings: number;
  totalBookedHours: number;
  mostBookedFacilities: {
    facilityName: string;
    level: string;
    bookingCount: number;
  }[];
  mostActiveUsers: {
    userName: string;
    email: string;
    bookingCount: number;
  }[];
};

export type ReportBookingFacility = {
  id: string;
  code: string;
  name: string;
  level: string;
  type: FacilityType;
};

export type ReportBookingUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export type BookingHistoryRow = {
  id: string;
  title: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  approvalRequired: boolean;
  attendeeCount: number | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  facility: ReportBookingFacility | null;
  user: ReportBookingUser | null;
  approvalStatus: ApprovalStatus | null;
  approvalRemarks: string | null;
};

export type CancelledBookingRow = BookingHistoryRow & {
  cancelledAt: string | null;
  cancellationReason: string | null;
};

export type FacilityUtilizationRow = {
  facilityId: string;
  code: string;
  facilityName: string;
  level: string;
  type: FacilityType;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalBookedHours: number;
};

export type UserBookingSummaryRow = {
  userId: string;
  userName: string;
  email: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalBookedHours: number;
};

export type AuditLogReportRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  summary: string | null;
  createdAt: string;
};

export type AdminReportsData = {
  filters: ReportFilters;
  summary: ReportSummary;
  bookingHistory: BookingHistoryRow[];
  facilityUtilization: FacilityUtilizationRow[];
  userBookingSummary: UserBookingSummaryRow[];
  cancelledBookings: CancelledBookingRow[];
  auditLogs: AuditLogReportRow[];
};

export type ReportExportType =
  | "booking-history"
  | "facility-utilization"
  | "user-bookings"
  | "cancelled-bookings"
  | "audit-logs";

