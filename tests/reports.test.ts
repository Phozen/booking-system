import { describe, expect, it } from "vitest";

import { buildReportCsv } from "@/lib/admin/reports/export";
import {
  parseReportFilters,
  serializeReportFilters,
} from "@/lib/admin/reports/validation";
import type { AdminReportsData } from "@/lib/admin/reports/types";

const emptyReports: AdminReportsData = {
  filters: {
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    dateFromIso: "2026-06-01T00:00:00.000Z",
    dateToExclusiveIso: "2026-07-01T00:00:00.000Z",
  },
  summary: {
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    rejectedBookings: 0,
    pendingBookings: 0,
    totalBookedHours: 0,
    mostBookedFacilities: [],
    mostActiveUsers: [],
  },
  bookingHistory: [],
  facilityUtilization: [],
  userBookingSummary: [],
  cancelledBookings: [],
  auditLogs: [],
};

describe("report filters", () => {
  it("parses valid filters and makes the dateTo value inclusive in the UI", () => {
    const filters = parseReportFilters({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      facilityId: "11111111-1111-4111-8111-111111111111",
      status: "confirmed",
    });

    expect(filters).toMatchObject({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      dateFromIso: "2026-06-01T00:00:00.000Z",
      dateToExclusiveIso: "2026-07-01T00:00:00.000Z",
      facilityId: "11111111-1111-4111-8111-111111111111",
      status: "confirmed",
    });
  });

  it("serializes empty facility and status filters as all", () => {
    const serialized = serializeReportFilters(emptyReports.filters);

    expect(serialized).toEqual({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      facilityId: "all",
      status: "all",
    });
  });
});

describe("CSV exports", () => {
  it("escapes commas, quotes, and newlines in booking history CSV", () => {
    const data: AdminReportsData = {
      ...emptyReports,
      bookingHistory: [
        {
          id: "booking-1",
          title: "Board \"planning\", Q1\nFollow-up",
          status: "confirmed",
          startsAt: "2026-06-01T02:00:00.000Z",
          endsAt: "2026-06-01T03:00:00.000Z",
          createdAt: "2026-05-01T00:00:00.000Z",
          approvalRequired: false,
          attendeeCount: 8,
          cancellationReason: null,
          cancelledAt: null,
          facility: {
            id: "facility-1",
            code: "MR-L5-01",
            name: "Meeting Room 1",
            level: "Level 5",
            type: "meeting_room",
          },
          user: {
            id: "user-1",
            email: "employee@example.com",
            fullName: "Employee One",
          },
          approvalStatus: null,
          approvalRemarks: null,
        },
      ],
    };

    const { csv, rowCount } = buildReportCsv(data, "booking-history");

    expect(rowCount).toBe(1);
    expect(csv).toContain("Title,Facility,User,Date,Time,Status");
    expect(csv).toContain("\"Board \"\"planning\"\", Q1\nFollow-up\"");
  });
});
