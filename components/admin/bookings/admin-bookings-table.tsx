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
import { formatBookingUsageStatus } from "@/lib/bookings/usage";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function AdminBookingsTable({
  bookings,
  facilities,
  levelOptions,
  selectedFacilityId,
  selectedStatus,
  selectedDateFrom,
  selectedDateTo,
  selectedUserSearch,
  selectedLevel,
}: {
  bookings: AdminBooking[];
  facilities: Facility[];
  levelOptions: string[];
  selectedFacilityId?: string;
  selectedStatus?: BookingStatus;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedUserSearch?: string;
  selectedLevel?: string;
}) {
  const hasActiveFilters = Boolean(
    selectedFacilityId ||
      selectedStatus ||
      selectedDateFrom ||
      selectedDateTo ||
      selectedUserSearch ||
      selectedLevel,
  );

  return (
    <div className="grid gap-5">
      <AdminFilterBar title="Booking filters">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(0,180px)_minmax(0,220px)_minmax(0,150px)_minmax(0,150px)_minmax(0,200px)_minmax(0,160px)_auto_auto] 2xl:items-end [&>*]:min-w-0">
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Booking status
            </label>
            <Select
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
            </Select>
          </div>

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
                    label: "Room",
                    value: booking.facility
                      ? `${booking.facility.name}, ${booking.facility.level}`
                      : "Room unavailable",
                  },
                  {
                    label: "Requester",
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
                    label: "Departments",
                    value:
                      booking.departments.length > 0
                        ? booking.departments
                            .map((department) => department.name)
                            .join(", ")
                        : "None tagged",
                  },
                  {
                    label: "Usage",
                    value: formatBookingUsageStatus(booking.usageStatus),
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
              title="No bookings match these filters."
            />
          )
        }
      >
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Requester</th>
              <th className="px-4 py-3 font-medium">Departments</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Approval</th>
              <th className="px-4 py-3 font-medium">Created</th>
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {booking.departments.length > 0
                      ? booking.departments
                          .map((department) => department.name)
                          .join(", ")
                      : "-"}
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
                    {formatBookingUsageStatus(booking.usageStatus)}
                  </td>
                  <td className="px-4 py-3">
                    {booking.approvalRequired ? "Required" : "Not required"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatBookingDateTime(booking.createdAt)}
                  </td>
                  <td className="sticky right-0 border-l bg-background px-4 py-3 text-right">
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
                <td className="px-4 py-8" colSpan={11}>
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No bookings match these filters."
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
