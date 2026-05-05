import Link from "next/link";
import { CheckSquare } from "lucide-react";

import type { AdminBooking } from "@/lib/admin/bookings/queries";
import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

export function PendingApprovalsTable({
  bookings,
}: {
  bookings: AdminBooking[];
}) {
  return (
    <AdminTableShell
      title="Pending approvals"
      description={`${bookings.length} requests waiting for review`}
      mobileCards={
        bookings.length > 0 ? (
          bookings.map((booking) => (
            <MobileRecordCard
              key={booking.id}
              eyebrow="Pending request"
              title={booking.title}
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
            description="There are no booking requests waiting for admin review."
          />
        )
      }
    >
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Facility</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Requested</th>
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
                  colSpan={7}
                >
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No pending approvals"
                    description="There are no booking requests waiting for admin review."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </AdminTableShell>
  );
}
