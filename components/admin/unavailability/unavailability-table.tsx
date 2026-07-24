import Link from "next/link";
import { Eye } from "lucide-react";

import type { BlockedPeriod } from "@/lib/admin/blocked-periods/queries";
import type { MaintenanceClosure } from "@/lib/admin/maintenance/queries";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

type UnavailabilityRecord = {
  id: string;
  type: "Closure" | "Maintenance";
  title: string;
  reason: string | null;
  affectedFacilities: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  href: string;
  status: React.ReactNode;
};

function getBlockedFacilities(period: BlockedPeriod) {
  if (period.scope === "all_facilities") {
    return "All facilities";
  }

  return period.facilities.map((facility) => facility.code).join(", ") || "No facilities selected";
}

function getMaintenanceFacility(closure: MaintenanceClosure) {
  return closure.facility
    ? `${closure.facility.name}, ${closure.facility.level}`
    : "Facility unavailable";
}

export function UnavailabilityTable({
  blockedPeriods,
  maintenanceClosures,
}: {
  blockedPeriods: BlockedPeriod[];
  maintenanceClosures: MaintenanceClosure[];
}) {
  const records: UnavailabilityRecord[] = [
    ...blockedPeriods.map((period) => ({
      id: `blocked-${period.id}`,
      type: "Closure" as const,
      title: period.title,
      reason: period.reason,
      affectedFacilities: getBlockedFacilities(period),
      startsAt: period.startsAt,
      endsAt: period.endsAt,
      createdAt: period.createdAt,
      href: `/admin/blocked-dates/${period.id}`,
      status: <StatusBadge kind="blocked-period" status={period.isActive} />,
    })),
    ...maintenanceClosures.map((closure) => ({
      id: `maintenance-${closure.id}`,
      type: "Maintenance" as const,
      title: closure.title,
      reason: closure.reason,
      affectedFacilities: getMaintenanceFacility(closure),
      startsAt: closure.startsAt,
      endsAt: closure.endsAt,
      createdAt: closure.createdAt,
      href: `/admin/maintenance/${closure.id}`,
      status: <StatusBadge kind="maintenance" status={closure.status} />,
    })),
  ].sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));

  const mobileCards = records.length > 0 ? (
    records.map((record) => (
      <MobileRecordCard
        key={record.id}
        eyebrow={record.type}
        title={record.title}
        badges={record.status}
        rows={[
          { label: "Facilities", value: record.affectedFacilities },
          { label: "Starts", value: formatBookingDateTime(record.startsAt) },
          { label: "Ends", value: formatBookingDateTime(record.endsAt) },
          { label: "Reason", value: record.reason || "No reason provided" },
        ]}
        actions={
          <Link href={record.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Eye data-icon="inline-start" />
            View details
          </Link>
        }
      />
    ))
  ) : (
    <EmptyState
      title="No unavailable time"
    />
  );

  return (
    <AdminTableShell
      title="Unavailable time"
      mobileCards={mobileCards}
    >
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Facilities</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Starts</th>
            <th className="px-4 py-3 font-medium">Ends</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? records.map((record) => (
            <tr key={record.id} className="border-t">
              <td className="px-4 py-3 font-medium">{record.type}</td>
              <td className="px-4 py-3 font-medium">{record.title}</td>
              <td className="max-w-[230px] px-4 py-3 text-muted-foreground">{record.affectedFacilities}</td>
              <td className="px-4 py-3">{record.status}</td>
              <td className="px-4 py-3">{formatBookingDateTime(record.startsAt)}</td>
              <td className="px-4 py-3">{formatBookingDateTime(record.endsAt)}</td>
              <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">{record.reason || "No reason provided"}</td>
              <td className="px-4 py-3 text-right">
                <Link href={record.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Eye data-icon="inline-start" />
                  View
                </Link>
              </td>
            </tr>
          )) : (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                No unavailable time found. Add one when bookings need to be prevented.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
