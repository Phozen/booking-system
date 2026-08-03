import Link from "next/link";
import { Filter, RotateCcw } from "lucide-react";

import type { AdminBooking } from "@/lib/admin/bookings/queries";
import type { Facility } from "@/lib/facilities/queries";
import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import {
  formatCateringServingTime,
  formatCateringType,
} from "@/lib/bookings/catering/format";
import { PendingApprovalRowActions } from "@/components/admin/approvals/pending-approval-row-actions";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function formatCateringSummary(booking: AdminBooking) {
  if (!booking.catering.required) {
    return "Not requested";
  }

  return [
    formatCateringType(booking.catering.type),
    booking.catering.pax ? `${booking.catering.pax} pax` : null,
    booking.catering.servingTime
      ? formatCateringServingTime(booking.catering.servingTime)
      : null,
  ]
    .filter(Boolean)
    .join(" - ");
}

export function PendingApprovalsTable({
  bookings,
  facilities,
  selectedFacilityId,
  selectedDateFrom,
  selectedDateTo,
  selectedUserSearch,
}: {
  bookings: AdminBooking[];
  facilities: Facility[];
  selectedFacilityId?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedUserSearch?: string;
}) {
  const hasActiveFilters = Boolean(
    selectedFacilityId ||
      selectedDateFrom ||
      selectedDateTo ||
      selectedUserSearch,
  );

  return (
    <div className="grid gap-5">
      <AdminFilterBar title="Approval filters">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,260px)_minmax(0,160px)_minmax(0,160px)_minmax(0,220px)_auto_auto] xl:items-end [&>*]:min-w-0">
          <div className="grid gap-2">
            <label htmlFor="facilityId" className="text-sm font-medium">
              Room
            </label>
            <Select
              id="facilityId"
              name="facilityId"
              defaultValue={selectedFacilityId ?? "all"}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All rooms</option>
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

          <div className="grid gap-2">
            <label htmlFor="q" className="text-sm font-medium">
              User / email
            </label>
            <Input
              id="q"
              name="q"
              type="search"
              placeholder="Name or email"
              defaultValue={selectedUserSearch ?? ""}
              className="h-10"
            />
          </div>

          <button
            className={buttonVariants({
              variant: "outline",
              className: "w-full md:w-auto",
            })}
            type="submit"
          >
            <Filter data-icon="inline-start" />
            Apply filters
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/approvals"
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
        title="Approval queue"
        mobileCards={
          bookings.length > 0 ? (
            bookings.map((booking) => (
              <MobileRecordCard
                key={booking.id}
                eyebrow="Pending room request"
                title={booking.title}
                rows={[
                  {
                    label: "Room",
                    value: booking.facility
                      ? `${booking.facility.name}, ${booking.facility.level}`
                      : "Room unavailable",
                  },
                  {
                    label: "Requester",
                    value:
                      booking.user?.fullName || booking.user?.email || "Unknown",
                  },
                  {
                    label: "Date and time",
                    value: `${formatBookingDate(booking.startsAt)} - ${formatBookingWindow(
                      booking.startsAt,
                      booking.endsAt,
                    )}`,
                  },
                  {
                    label: "Requested",
                    value: formatBookingDateTime(booking.createdAt),
                  },
                  {
                    label: "Catering",
                    value: formatCateringSummary(booking),
                  },
                  {
                    label: "Departments",
                    value:
                      booking.departments.length > 0
                        ? booking.departments
                            .map((department) => department.name)
                            .join(", ")
                        : "None tagged",
                  },
                ]}
                actions={<PendingApprovalRowActions bookingId={booking.id} />}
              />
            ))
          ) : (
            <EmptyState
              className="bg-transparent"
              title="No pending approvals."
            />
          )
        }
      >
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Requester</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3 font-medium">Catering</th>
              <th className="px-4 py-3 font-medium">Departments</th>
              <th className="sticky right-0 border-l bg-muted/60 px-4 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{booking.title}</td>
                  <td className="px-4 py-3">
                    {booking.facility
                      ? `${booking.facility.name}, ${booking.facility.level}`
                      : "Room unavailable"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {booking.user?.fullName || booking.user?.email || "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    {formatBookingDate(booking.startsAt)}
                  </td>
                  <td className="px-4 py-3">
                    {formatBookingWindow(booking.startsAt, booking.endsAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatBookingDateTime(booking.createdAt)}
                  </td>
                  <td className="px-4 py-3">{formatCateringSummary(booking)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {booking.departments.length > 0
                      ? booking.departments
                          .map((department) => department.name)
                          .join(", ")
                      : "-"}
                  </td>
                  <td className="sticky right-0 border-l bg-background px-4 py-3 text-right">
                    <PendingApprovalRowActions bookingId={booking.id} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8" colSpan={9}>
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No pending approvals."
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
