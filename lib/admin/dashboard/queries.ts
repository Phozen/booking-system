import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getAdminBookings,
  getPendingApprovalBookings,
  type AdminBooking,
} from "@/lib/admin/bookings/queries";
import { getAdminBlockedPeriods } from "@/lib/admin/blocked-periods/queries";
import { getAdminMaintenanceClosures } from "@/lib/admin/maintenance/queries";
import { getAdminAuditLogs } from "@/lib/admin/audit-logs/queries";
import { parseAuditLogFilters } from "@/lib/admin/audit-logs/validation";

export type AdminDashboardMetrics = {
  pendingApprovalsCount: number;
  upcomingBookingsCount: number;
  activeUnavailabilityCount: number;
};

export type AdminDashboardData = {
  metrics: AdminDashboardMetrics;
  pendingApprovals: AdminBooking[];
  upcomingBookings: AdminBooking[];
  activeUnavailability: {
    id: string;
    title: string;
    kind: "blocked" | "maintenance";
    startsAt: string;
    endsAt: string;
    href: string;
  }[];
  recentAudit: {
    id: string;
    summary: string | null;
    actorEmail: string | null;
    createdAt: string;
  }[];
};

const PREVIEW_LIMIT = 5;

function todayDateInput() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function getAdminDashboardData(
  supabase: SupabaseClient,
): Promise<AdminDashboardData> {
  const nowIso = new Date().toISOString();
  const today = todayDateInput();
  const auditFilters = parseAuditLogFilters({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    dateTo: today,
  });

  const [
    pendingApprovals,
    confirmedFromToday,
    blockedPeriods,
    maintenanceClosures,
    recentAuditResult,
  ] = await Promise.all([
    getPendingApprovalBookings(supabase),
    getAdminBookings(supabase, {
      status: "confirmed",
      dateFrom: today,
    }),
    getAdminBlockedPeriods(supabase),
    getAdminMaintenanceClosures(supabase),
    getAdminAuditLogs(supabase, { ...auditFilters, limit: PREVIEW_LIMIT }),
  ]);

  const upcomingBookings = confirmedFromToday
    .filter((booking) => booking.startsAt >= nowIso)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const activeBlocked = blockedPeriods.filter(
    (period) =>
      period.isActive && period.endsAt >= nowIso && period.startsAt <= nowIso,
  );
  const activeMaintenance = maintenanceClosures.filter(
    (closure) =>
      (closure.status === "scheduled" || closure.status === "in_progress") &&
      closure.endsAt >= nowIso &&
      closure.startsAt <= nowIso,
  );

  const activeUnavailability = [
    ...activeBlocked.map((period) => ({
      id: period.id,
      title: period.title,
      kind: "blocked" as const,
      startsAt: period.startsAt,
      endsAt: period.endsAt,
      href: `/admin/blocked-dates/${period.id}`,
    })),
    ...activeMaintenance.map((closure) => ({
      id: closure.id,
      title: closure.title,
      kind: "maintenance" as const,
      startsAt: closure.startsAt,
      endsAt: closure.endsAt,
      href: `/admin/maintenance/${closure.id}`,
    })),
  ]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, PREVIEW_LIMIT);

  return {
    metrics: {
      pendingApprovalsCount: pendingApprovals.length,
      upcomingBookingsCount: upcomingBookings.length,
      activeUnavailabilityCount: activeBlocked.length + activeMaintenance.length,
    },
    pendingApprovals: pendingApprovals.slice(0, PREVIEW_LIMIT),
    upcomingBookings: upcomingBookings.slice(0, PREVIEW_LIMIT),
    activeUnavailability,
    recentAudit: recentAuditResult.rows.map((row) => ({
      id: row.id,
      summary: row.summary,
      actorEmail: row.actorEmail,
      createdAt: row.createdAt,
    })),
  };
}
