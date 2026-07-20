import Link from "next/link";
import { CheckSquare } from "lucide-react";

import type { AdminBooking } from "@/lib/admin/bookings/queries";
import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import {
  formatCateringServingTime,
  formatCateringType,
} from "@/lib/bookings/catering/format";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

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
}: {
  bookings: AdminBooking[];
}) {
  return (
    <AdminTableShell
      title="Approval queue"
      description={`${bookings.length} requests waiting for review`}
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
                      ? booking.departments.map((department) => department.name).join(", ")
                      : "None tagged",
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
                  <CheckSquare data-icon="inline-start" />
                  Review request
                </Link>
              }
            />
          ))
        ) : (
          <EmptyState
            className="bg-transparent"
            title="No pending approvals"
            description="New room requests that need approval will appear here."
          />
        )
      }
    >
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
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
              <th className="px-4 py-3 text-right font-medium">Review</th>
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
                  <td className="px-4 py-3">
                    {formatCateringSummary(booking)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {booking.departments.length > 0
                      ? booking.departments.map((department) => department.name).join(", ")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <CheckSquare data-icon="inline-start" />
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8"
                  colSpan={9}
                >
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No pending approvals"
                    description="New room requests that need approval will appear here."
                  />
                </td>
              </tr>
            )}
          </tbody>
      </table>
    </AdminTableShell>
  );
}
