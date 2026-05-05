import Link from "next/link";
import { Eye, Filter, RotateCcw } from "lucide-react";

import { adminBookingStatusOptions } from "@/lib/admin/bookings/validation";
import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import type { BookingStatus } from "@/lib/bookings/queries";
import type { Facility } from "@/lib/facilities/queries";
import type { AdminBooking } from "@/lib/admin/bookings/queries";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

export function AdminBookingsTable({
  bookings,
  facilities,
  selectedFacilityId,
  selectedStatus,
}: {
  bookings: AdminBooking[];
  facilities: Facility[];
  selectedFacilityId?: string;
  selectedStatus?: BookingStatus;
}) {
  const hasActiveFilters = Boolean(selectedFacilityId || selectedStatus);

  return (
    <div className="grid gap-5">
      <AdminFilterBar>
      <form className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,280px)_auto_auto] md:items-end [&>*]:min-w-0">
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
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </select>
        </div>

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
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} - {facility.level}
              </option>
            ))}
          </select>
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
            href="/admin/bookings"
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
        title="Bookings"
        description={`${bookings.length} booking records`}
        mobileCards={
          bookings.length > 0 ? (
            bookings.map((booking) => (
              <MobileRecordCard
                key={booking.id}
                eyebrow={booking.facility?.code ?? "Booking"}
                title={booking.title}
                badges={<BookingStatusBadge status={booking.status} />}
                rows={[
                  {
                    label: "Facility",
                    value: booking.facility
                      ? `${booking.facility.name}, ${booking.facility.level}`
                      : "Unavailable",
                  },
                  {
                    label: "User",
                    value:
                      booking.user?.fullName ||
                      booking.user?.email ||
                      "Unknown",
                  },
                  {
                    label: "Date and time",
                    value: `${formatBookingDate(booking.startsAt)} - ${formatBookingWindow(
                      booking.startsAt,
                      booking.endsAt,
                    )}`,
                  },
                  {
                    label: "Approval",
                    value: booking.approvalRequired
                      ? "Required"
                      : "Not required",
                  },
                  {
                    label: "Created",
                    value: formatBookingDateTime(booking.createdAt),
                  },
                ]}
                actions={
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    <Eye data-icon="inline-start" />
                    View details
                  </Link>
                }
              />
            ))
          ) : (
            <EmptyState
              className="bg-transparent"
              title="No bookings found"
              description={
                hasActiveFilters
                  ? "No bookings match these filters. Clear filters or adjust the selection."
                  : "No booking records are available yet."
              }
            />
          )
        }
      >
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Facility</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Approval</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
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
                        : "Unavailable"}
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
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3">
                      {booking.approvalRequired ? "Required" : "Not required"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatBookingDateTime(booking.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
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
                    <td className="px-4 py-8" colSpan={9}>
                      <EmptyState
                        className="border-0 bg-transparent py-4"
                        title="No bookings found"
                        description={
                          hasActiveFilters
                            ? "No bookings match these filters. Clear filters or adjust the selection."
                            : "No booking records are available yet."
                        }
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
