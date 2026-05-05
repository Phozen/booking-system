import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";

import {
  formatBookingDate,
  formatBookingWindow,
} from "@/lib/bookings/format";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { buttonVariants } from "@/components/ui/button";

export function BookingCard({ booking }: { booking: EmployeeBooking }) {
  return (
    <article className="grid gap-4 rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <span className="text-xs text-muted-foreground">
            {formatBookingDate(booking.startsAt)}
          </span>
        </div>

        <h3 className="mt-2 truncate text-base font-semibold tracking-normal">
          {booking.title}
        </h3>

        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4" aria-hidden="true" />
            {booking.facility
              ? `${booking.facility.name}, ${booking.facility.level}`
              : "Facility unavailable"}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="size-4" aria-hidden="true" />
            {formatBookingWindow(booking.startsAt, booking.endsAt)}
          </span>
        </div>
      </div>

      <Link
        href={`/bookings/${booking.id}`}
        className={buttonVariants({
          variant: "outline",
          className: "w-full sm:w-fit",
        })}
      >
        View details
        <ArrowRight data-icon="inline-end" />
      </Link>
    </article>
  );
}
