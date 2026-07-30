import Link from "next/link";
import { CalendarDays } from "lucide-react";

import type { CalendarMonth } from "@/lib/calendar/date-range";
import type { BookingStatus } from "@/lib/bookings/queries";
import type { CalendarViewMode } from "@/lib/calendar/visibility";
import type { Facility } from "@/lib/facilities/queries";
import { adminBookingStatusOptions } from "@/lib/admin/bookings/validation";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function buildHref({
  basePath,
  month,
  status,
  facilityId,
  view,
}: {
  basePath: string;
  month: CalendarMonth;
  status?: BookingStatus;
  facilityId?: string;
  view?: CalendarViewMode;
}) {
  const params = new URLSearchParams({
    month: month.value,
  });

  if (view) {
    params.set("view", view);
  }

  if (status) {
    params.set("status", status);
  }

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  return `${basePath}?${params.toString()}`;
}

export function CalendarControls({
  basePath,
  selectedMonth,
  selectedStatus,
  selectedFacilityId,
  facilities,
  showFacilityFilter,
  selectedView,
  showViewToggle,
  compact = false,
}: {
  basePath: string;
  selectedMonth: CalendarMonth;
  selectedStatus?: BookingStatus;
  selectedFacilityId?: string;
  timezone?: string;
  facilities?: Facility[];
  showFacilityFilter?: boolean;
  selectedView?: CalendarViewMode;
  showViewToggle?: boolean;
  /** Employee calendar uses quieter chrome than admin. */
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "grid gap-4",
        !compact && "rounded-lg border border-border bg-card p-4",
      )}
      aria-label="Calendar filters"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="qbook-type-meta">Month</p>
          <p className="qbook-type-section mt-0.5 qbook-type-tabular">
            {selectedMonth.label}
          </p>
        </div>

        {showViewToggle ? (
          <nav
            aria-label="Calendar visibility"
            className="grid grid-cols-2 gap-2 sm:flex"
          >
            <Link
              href={buildHref({
                basePath,
                month: selectedMonth,
                status: selectedStatus,
                facilityId: selectedFacilityId,
                view: "my",
              })}
              className={buttonVariants({
                variant: selectedView === "my" ? "default" : "outline",
                size: "sm",
              })}
              aria-current={selectedView === "my" ? "page" : undefined}
            >
              My bookings
            </Link>
            <Link
              href={buildHref({
                basePath,
                month: selectedMonth,
                status: selectedStatus,
                facilityId: selectedFacilityId,
                view: "all",
              })}
              className={buttonVariants({
                variant: selectedView === "all" ? "default" : "outline",
                size: "sm",
              })}
              aria-current={selectedView === "all" ? "page" : undefined}
            >
              All bookings
            </Link>
          </nav>
        ) : null}
      </div>

      <form
        className={cn(
          "grid gap-3 md:items-end [&>*]:min-w-0",
          showFacilityFilter
            ? "md:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto]"
            : "md:grid-cols-[repeat(2,minmax(0,1fr))_auto_auto]",
        )}
      >
        {selectedView ? (
          <input type="hidden" name="view" value={selectedView} />
        ) : null}
        <div className="grid gap-2">
          <label htmlFor="month" className="text-sm font-medium">
            Jump to month
          </label>
          <Input
            id="month"
            name="month"
            type="month"
            defaultValue={selectedMonth.value}
            className="qbook-type-tabular"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <Select
            id="status"
            name="status"
            defaultValue={selectedStatus ?? "all"}
          >
            {adminBookingStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all"
                  ? "All statuses"
                  : status.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>

        {showFacilityFilter ? (
          <div className="grid gap-2">
            <label htmlFor="facilityId" className="text-sm font-medium">
              Facility
            </label>
            <Select
              id="facilityId"
              name="facilityId"
              defaultValue={selectedFacilityId ?? "all"}
            >
              <option value="all">All facilities</option>
              {(facilities ?? []).map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}, {facility.level}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <input type="hidden" name="facilityId" value="all" />
        )}

        <button
          className={buttonVariants({ size: "sm", className: "w-full md:w-auto" })}
          type="submit"
        >
          <CalendarDays data-icon="inline-start" />
          Apply
        </button>

        <Link
          href={basePath}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "w-full md:w-auto",
          })}
        >
          Clear
        </Link>
      </form>
    </section>
  );
}
