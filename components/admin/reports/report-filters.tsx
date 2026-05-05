import Link from "next/link";
import { Download, Filter, RotateCcw } from "lucide-react";

import { reportBookingStatusOptions } from "@/lib/admin/reports/validation";
import type { ReportExportType, ReportFilters } from "@/lib/admin/reports/types";
import type { Facility } from "@/lib/facilities/queries";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { buttonVariants } from "@/components/ui/button";

const exports: { type: ReportExportType; label: string }[] = [
  { type: "booking-history", label: "Export booking history CSV" },
  { type: "facility-utilization", label: "Export facility utilization CSV" },
  { type: "user-bookings", label: "Export user booking summary CSV" },
  { type: "cancelled-bookings", label: "Export cancelled bookings CSV" },
  { type: "audit-logs", label: "Export audit logs CSV" },
];

function buildExportHref(type: ReportExportType, filters: ReportFilters) {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    facilityId: filters.facilityId ?? "all",
    status: filters.status ?? "all",
  });

  return `/admin/reports/export/${type}?${params.toString()}`;
}

export function ReportFilters({
  facilities,
  filters,
}: {
  facilities: Facility[];
  filters: ReportFilters;
}) {
  return (
    <AdminFilterBar
      title="Report filters"
      description="Apply filters before reviewing previews or exporting CSV files."
    >
      <form className="grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] lg:items-end">
        <div className="grid gap-2">
          <label htmlFor="dateFrom" className="text-sm font-medium">
            From
          </label>
          <input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={filters.dateFrom}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="dateTo" className="text-sm font-medium">
            To
          </label>
          <input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={filters.dateTo}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="facilityId" className="text-sm font-medium">
            Facility
          </label>
          <select
            id="facilityId"
            name="facilityId"
            defaultValue={filters.facilityId ?? "all"}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All facilities</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} - {facility.level}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? "all"}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {reportBookingStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </select>
        </div>

        <button className={buttonVariants({ variant: "outline" })} type="submit">
          <Filter data-icon="inline-start" />
          Apply
        </button>

        <Link href="/admin/reports" className={buttonVariants({ variant: "ghost" })}>
          <RotateCcw data-icon="inline-start" />
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {exports.map((item) => (
          <Link
            key={item.type}
            href={buildExportHref(item.type, filters)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Download data-icon="inline-start" />
            {item.label}
          </Link>
        ))}
      </div>
    </AdminFilterBar>
  );
}
