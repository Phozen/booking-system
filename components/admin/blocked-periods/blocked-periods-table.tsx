import Link from "next/link";
import { Eye } from "lucide-react";

import { formatBlockedPeriodScope } from "@/lib/admin/blocked-periods/validation";
import type { BlockedPeriod } from "@/lib/admin/blocked-periods/queries";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

function getAffectedFacilities(period: BlockedPeriod) {
  if (period.scope === "all_facilities") {
    return "All facilities";
  }

  return (
    period.facilities.map((facility) => facility.code).join(", ") ||
    "No facilities selected"
  );
}

export function BlockedPeriodsTable({
  blockedPeriods,
}: {
  blockedPeriods: BlockedPeriod[];
}) {
  const mobileCards =
    blockedPeriods.length > 0 ? (
      blockedPeriods.map((period) => (
        <MobileRecordCard
          key={period.id}
          eyebrow={formatBlockedPeriodScope(period.scope)}
          title={period.title}
          badges={
            <StatusBadge kind="blocked-period" status={period.isActive} />
          }
          rows={[
            {
              label: "Affected facilities",
              value: getAffectedFacilities(period),
            },
            {
              label: "Starts",
              value: formatBookingDateTime(period.startsAt),
            },
            {
              label: "Ends",
              value: formatBookingDateTime(period.endsAt),
            },
            {
              label: "Reason",
              value: period.reason || "No reason provided",
            },
          ]}
          actions={
            <Link
              href={`/admin/blocked-dates/${period.id}`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
              })}
            >
              <Eye data-icon="inline-start" />
              View blocked period
            </Link>
          }
        />
      ))
    ) : (
      <EmptyState
        title="No blocked periods"
        description="Create a blocked period when facilities should be unavailable for bookings."
      />
    );

  return (
    <AdminTableShell
      title="Blocked date records"
      description={`${blockedPeriods.length} blocked period records`}
      mobileCards={mobileCards}
    >
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Affected facilities</th>
              <th className="px-4 py-3 font-medium">Starts</th>
              <th className="px-4 py-3 font-medium">Ends</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blockedPeriods.length > 0 ? (
              blockedPeriods.map((period) => (
                <tr key={period.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{period.title}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                    {period.reason || "No reason provided"}
                  </td>
                  <td className="px-4 py-3">
                    {formatBlockedPeriodScope(period.scope)}
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                    {getAffectedFacilities(period)}
                  </td>
                  <td className="px-4 py-3">
                    {formatBookingDateTime(period.startsAt)}
                  </td>
                  <td className="px-4 py-3">
                    {formatBookingDateTime(period.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      kind="blocked-period"
                      status={period.isActive}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatBookingDateTime(period.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/blocked-dates/${period.id}`}
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
                  colSpan={9}
                >
                  No blocked periods found. Create one when a facility or all
                  facilities should be unavailable.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </AdminTableShell>
  );
}
