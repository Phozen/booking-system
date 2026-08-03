import Link from "next/link";
import { Eye, Filter, RotateCcw } from "lucide-react";

import type { BlockedPeriod } from "@/lib/admin/blocked-periods/queries";
import type { MaintenanceClosure } from "@/lib/admin/maintenance/queries";
import type { Facility } from "@/lib/facilities/queries";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type UnavailabilityRecord = {
  id: string;
  type: "Closure" | "Maintenance";
  title: string;
  reason: string | null;
  affectedFacilities: string;
  facilityIds: string[];
  scope: "all_facilities" | "selected_facilities" | "facility";
  isActiveLike: boolean;
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

  return (
    period.facilities.map((facility) => facility.code).join(", ") ||
    "No facilities selected"
  );
}

function getMaintenanceFacility(closure: MaintenanceClosure) {
  return closure.facility
    ? `${closure.facility.name}, ${closure.facility.level}`
    : "Facility unavailable";
}

export function UnavailabilityTable({
  blockedPeriods,
  maintenanceClosures,
  facilities,
  selectedType,
  selectedActive,
  selectedScope,
  selectedFacilityId,
  selectedDateFrom,
  selectedDateTo,
}: {
  blockedPeriods: BlockedPeriod[];
  maintenanceClosures: MaintenanceClosure[];
  facilities: Facility[];
  selectedType?: "closure" | "maintenance";
  selectedActive?: "active" | "inactive";
  selectedScope?: "all_facilities" | "selected_facilities" | "facility";
  selectedFacilityId?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
}) {
  const records: UnavailabilityRecord[] = [
    ...blockedPeriods.map((period) => ({
      id: `blocked-${period.id}`,
      type: "Closure" as const,
      title: period.title,
      reason: period.reason,
      affectedFacilities: getBlockedFacilities(period),
      facilityIds: period.facilities.map((facility) => facility.id),
      scope:
        period.scope === "all_facilities"
          ? ("all_facilities" as const)
          : ("selected_facilities" as const),
      isActiveLike: period.isActive,
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
      facilityIds: closure.facility ? [closure.facility.id] : [],
      scope: "facility" as const,
      isActiveLike:
        closure.status === "scheduled" || closure.status === "in_progress",
      startsAt: closure.startsAt,
      endsAt: closure.endsAt,
      createdAt: closure.createdAt,
      href: `/admin/maintenance/${closure.id}`,
      status: <StatusBadge kind="maintenance" status={closure.status} />,
    })),
  ]
    .filter((record) => {
      if (selectedType === "closure" && record.type !== "Closure") return false;
      if (selectedType === "maintenance" && record.type !== "Maintenance") {
        return false;
      }
      if (selectedActive === "active" && !record.isActiveLike) return false;
      if (selectedActive === "inactive" && record.isActiveLike) return false;
      if (selectedScope && record.scope !== selectedScope) return false;
      if (selectedFacilityId) {
        if (record.scope === "all_facilities") {
          // all-facility closures still match any facility filter
        } else if (!record.facilityIds.includes(selectedFacilityId)) {
          return false;
        }
      }
      if (selectedDateFrom && record.startsAt.slice(0, 10) < selectedDateFrom) {
        return false;
      }
      if (selectedDateTo && record.startsAt.slice(0, 10) > selectedDateTo) {
        return false;
      }
      return true;
    })
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));

  const hasActiveFilters = Boolean(
    selectedType ||
      selectedActive ||
      selectedScope ||
      selectedFacilityId ||
      selectedDateFrom ||
      selectedDateTo,
  );

  const mobileCards =
    records.length > 0 ? (
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
            <Link
              href={record.href}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Eye data-icon="inline-start" />
              View details
            </Link>
          }
        />
      ))
    ) : (
      <EmptyState title="No unavailable time" />
    );

  return (
    <div className="grid gap-5">
      <AdminFilterBar title="Unavailability filters">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(0,150px)_minmax(0,140px)_minmax(0,180px)_minmax(0,220px)_minmax(0,150px)_minmax(0,150px)_auto_auto] 2xl:items-end [&>*]:min-w-0">
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
              <option value="closure">Closure</option>
              <option value="maintenance">Maintenance</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="active" className="text-sm font-medium">
              Active state
            </label>
            <Select
              id="active"
              name="active"
              defaultValue={selectedActive ?? "all"}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="scope" className="text-sm font-medium">
              Scope
            </label>
            <Select
              id="scope"
              name="scope"
              defaultValue={selectedScope ?? "all"}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All scopes</option>
              <option value="all_facilities">All facilities</option>
              <option value="selected_facilities">Selected facilities</option>
              <option value="facility">Single facility</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="facilityId" className="text-sm font-medium">
              Facility
            </label>
            <Select
              id="facilityId"
              name="facilityId"
              defaultValue={selectedFacilityId ?? "all"}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All facilities</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} - {facility.level}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="dateFrom" className="text-sm font-medium">
              From date
            </label>
            <Input
              id="dateFrom"
              name="dateFrom"
              type="date"
              defaultValue={selectedDateFrom ?? ""}
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="dateTo" className="text-sm font-medium">
              To date
            </label>
            <Input
              id="dateTo"
              name="dateTo"
              type="date"
              defaultValue={selectedDateTo ?? ""}
              className="h-10"
            />
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
              href="/admin/unavailability"
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

      <AdminTableShell title="Unavailable time" mobileCards={mobileCards}>
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
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{record.type}</td>
                  <td className="px-4 py-3 font-medium">{record.title}</td>
                  <td className="max-w-[230px] px-4 py-3 text-muted-foreground">
                    {record.affectedFacilities}
                  </td>
                  <td className="px-4 py-3">{record.status}</td>
                  <td className="px-4 py-3">
                    {formatBookingDateTime(record.startsAt)}
                  </td>
                  <td className="px-4 py-3">
                    {formatBookingDateTime(record.endsAt)}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                    {record.reason || "No reason provided"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={record.href}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <Eye data-icon="inline-start" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8" colSpan={8}>
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No unavailable time found."
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
