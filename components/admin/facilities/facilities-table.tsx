import Link from "next/link";
import { Filter, Pencil, RotateCcw } from "lucide-react";

import {
  formatFacilityType,
  formatRequiresApproval,
} from "@/lib/facilities/format";
import type { Facility } from "@/lib/facilities/queries";
import {
  facilityStatusOptions,
  facilityTypeOptions,
  type FacilityStatus,
  type FacilityType,
} from "@/lib/facilities/validation";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function FacilitiesTable({
  facilities,
  levelOptions,
  selectedSearch,
  selectedLevel,
  selectedType,
  selectedStatus,
}: {
  facilities: Facility[];
  levelOptions: string[];
  selectedSearch?: string;
  selectedLevel?: string;
  selectedType?: FacilityType;
  selectedStatus?: FacilityStatus;
}) {
  const hasActiveFilters = Boolean(
    selectedSearch || selectedLevel || selectedType || selectedStatus,
  );

  return (
    <div className="grid gap-5">
      <AdminFilterBar title="Facility filters">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] xl:items-end [&>*]:min-w-0">
          <div className="grid gap-2">
            <label htmlFor="q" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="q"
              name="q"
              type="search"
              placeholder="Name or code"
              defaultValue={selectedSearch ?? ""}
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="level" className="text-sm font-medium">
              Level
            </label>
            <Select
              id="level"
              name="level"
              defaultValue={selectedLevel ?? "all"}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All levels</option>
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-medium">
              Type
            </label>
            <Select
              id="type"
              name="type"
              defaultValue={selectedType ?? "all"}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All types</option>
              {facilityTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {formatFacilityType(type)}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select
              id="status"
              name="status"
              defaultValue={selectedStatus ?? "all"}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All statuses</option>
              {facilityStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            className={buttonVariants({
              variant: "outline",
              className: "w-full md:w-auto",
            })}
          >
            <Filter data-icon="inline-start" />
            Apply filters
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/facilities"
              className={buttonVariants({
                variant: "ghost",
                className: "w-full md:w-auto",
              })}
            >
              <RotateCcw data-icon="inline-start" />
              Clear filters
            </Link>
          ) : null}
        </form>
      </AdminFilterBar>

      <AdminTableShell
        title="Facilities"
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
            <EmptyState className="bg-transparent" title="No facilities found." />
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
                <td className="px-4 py-8" colSpan={8}>
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No facilities found."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
