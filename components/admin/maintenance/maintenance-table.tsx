import Link from "next/link";
import { Eye } from "lucide-react";

import type { MaintenanceClosure } from "@/lib/admin/maintenance/queries";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

function getFacilityLabel(closure: MaintenanceClosure) {
  return closure.facility
    ? `${closure.facility.name}, ${closure.facility.level}`
    : "Facility unavailable";
}

export function MaintenanceTable({
  maintenanceClosures,
}: {
  maintenanceClosures: MaintenanceClosure[];
}) {
  const mobileCards =
    maintenanceClosures.length > 0 ? (
      maintenanceClosures.map((closure) => (
        <MobileRecordCard
          key={closure.id}
          eyebrow={getFacilityLabel(closure)}
          title={closure.title}
          badges={<StatusBadge kind="maintenance" status={closure.status} />}
          rows={[
            {
              label: "Starts",
              value: formatBookingDateTime(closure.startsAt),
            },
            {
              label: "Ends",
              value: formatBookingDateTime(closure.endsAt),
            },
            {
              label: "Reason",
              value: closure.reason || "No reason provided",
            },
          ]}
          actions={
            <Link
              href={`/admin/maintenance/${closure.id}`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
              })}
            >
              <Eye data-icon="inline-start" />
              View maintenance
            </Link>
          }
        />
      ))
    ) : (
      <EmptyState
        title="No maintenance closures"
        description="Create a closure when a facility should be unavailable for maintenance."
      />
    );

  return (
    <AdminTableShell
      title="Maintenance records"
      description={`${maintenanceClosures.length} maintenance records`}
      mobileCards={mobileCards}
    >
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Facility</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Starts</th>
              <th className="px-4 py-3 font-medium">Ends</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceClosures.length > 0 ? (
              maintenanceClosures.map((closure) => (
                <tr key={closure.id} className="border-t">
                  <td className="px-4 py-3">{getFacilityLabel(closure)}</td>
                  <td className="px-4 py-3 font-medium">{closure.title}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-muted-foreground">
                    {closure.reason || "No reason provided"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge kind="maintenance" status={closure.status} />
                  </td>
                  <td className="px-4 py-3">
                    {formatBookingDateTime(closure.startsAt)}
                  </td>
                  <td className="px-4 py-3">
                    {formatBookingDateTime(closure.endsAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatBookingDateTime(closure.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/maintenance/${closure.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <Eye data-icon="inline-start" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={8}
                >
                  No maintenance closures found. Create one when a facility
                  should be unavailable for maintenance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </AdminTableShell>
  );
}
