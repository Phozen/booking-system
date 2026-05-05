import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import {
  formatFacilityType,
  formatRequiresApproval,
} from "@/lib/facilities/format";
import type { Facility } from "@/lib/facilities/queries";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

export function FacilitiesTable({ facilities }: { facilities: Facility[] }) {
  return (
    <AdminTableShell
      title="Facilities"
      description={`${facilities.length} configured facility records`}
      actions={
        <Link
          href="/admin/facilities/new"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus data-icon="inline-start" />
          New facility
        </Link>
      }
      mobileCards={
        facilities.length > 0 ? (
          facilities.map((facility) => (
            <MobileRecordCard
              key={facility.id}
              eyebrow={facility.code}
              title={facility.name}
              badges={<StatusBadge kind="facility" status={facility.status} />}
              rows={[
                { label: "Level", value: facility.level },
                { label: "Type", value: formatFacilityType(facility.type) },
                { label: "Capacity", value: facility.capacity },
                {
                  label: "Approval setting",
                  value: formatRequiresApproval(facility.requiresApproval),
                },
                { label: "Display order", value: facility.displayOrder },
              ]}
              actions={
                <Link
                  href={`/admin/facilities/${facility.id}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })}
                >
                  <Pencil data-icon="inline-start" />
                  Edit facility
                </Link>
              }
            />
          ))
        ) : (
          <EmptyState
            className="bg-transparent"
            title="No facilities found"
            description="Create the first facility record to make it available for employees when active."
          />
        )
      }
    >
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Capacity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Approval</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.length > 0 ? (
              facilities.map((facility) => (
                <tr key={facility.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{facility.code}</td>
                  <td className="px-4 py-3">{facility.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {facility.level}
                  </td>
                  <td className="px-4 py-3">
                    {formatFacilityType(facility.type)}
                  </td>
                  <td className="px-4 py-3">{facility.capacity}</td>
                  <td className="px-4 py-3">
                    <StatusBadge kind="facility" status={facility.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatRequiresApproval(facility.requiresApproval)}
                  </td>
                  <td className="px-4 py-3">{facility.displayOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/facilities/${facility.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <Pencil data-icon="inline-start" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8" colSpan={9}>
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No facilities found"
                    description="Create the first facility record to make it available for employees when active."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </AdminTableShell>
  );
}
