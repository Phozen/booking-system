import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import {
  getCurrentCalendarMonth,
  shiftCalendarMonth,
  type CalendarMonth,
} from "@/lib/calendar/date-range";
import type { BookingStatus } from "@/lib/bookings/queries";
import type { Facility } from "@/lib/facilities/queries";
import { adminBookingStatusOptions } from "@/lib/admin/bookings/validation";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { buttonVariants } from "@/components/ui/button";

function buildHref({
  basePath,
  month,
  status,
  facilityId,
}: {
  basePath: string;
  month: CalendarMonth;
  status?: BookingStatus;
  facilityId?: string;
}) {
  const params = new URLSearchParams({
    month: month.value,
  });

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
  timezone,
  facilities,
  showFacilityFilter,
}: {
  basePath: string;
  selectedMonth: CalendarMonth;
  selectedStatus?: BookingStatus;
  selectedFacilityId?: string;
  timezone?: string;
  facilities?: Facility[];
  showFacilityFilter?: boolean;
}) {
  const previousMonth = shiftCalendarMonth(selectedMonth, -1, timezone);
  const nextMonth = shiftCalendarMonth(selectedMonth, 1, timezone);
  const currentMonth = getCurrentCalendarMonth(new Date(), timezone);

  return (
    <AdminFilterBar
      title="Calendar controls"
      description="Choose a month and optional filters. Booking items remain clickable links."
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Selected month
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal">
              {selectedMonth.label}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref({
                basePath,
                month: previousMonth,
                status: selectedStatus,
                facilityId: selectedFacilityId,
              })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ChevronLeft data-icon="inline-start" />
              Previous month
            </Link>
            <Link
              href={buildHref({
                basePath,
                month: currentMonth,
                status: selectedStatus,
                facilityId: selectedFacilityId,
              })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <RotateCcw data-icon="inline-start" />
              Current month
            </Link>
            <Link
              href={buildHref({
                basePath,
                month: nextMonth,
                status: selectedStatus,
                facilityId: selectedFacilityId,
              })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Next month
              <ChevronRight data-icon="inline-end" />
            </Link>
          </div>
        </div>

        <form className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto] md:items-end [&>*]:min-w-0">
          <div className="grid gap-2">
            <label htmlFor="month" className="text-sm font-medium">
              Month
            </label>
            <input
              id="month"
              name="month"
              type="month"
              defaultValue={selectedMonth.value}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={selectedStatus ?? "all"}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {adminBookingStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all"
                    ? "All statuses"
                    : status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {showFacilityFilter ? (
            <div className="grid gap-2">
              <label htmlFor="facilityId" className="text-sm font-medium">
                Facility
              </label>
              <select
                id="facilityId"
                name="facilityId"
                defaultValue={selectedFacilityId ?? "all"}
                className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All facilities</option>
                {(facilities ?? []).map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}, {facility.level}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="facilityId" value="all" />
          )}

          <button className={buttonVariants({ size: "sm", className: "w-full md:w-auto" })} type="submit">
            <CalendarDays data-icon="inline-start" />
            Apply filters
          </button>

          <Link
            href={basePath}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "w-full md:w-auto",
            })}
          >
            Clear filters
          </Link>
        </form>
      </div>
    </AdminFilterBar>
  );
}
