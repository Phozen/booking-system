import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";

import {
  formatBookingDate,
  formatBookingWindow,
} from "@/lib/bookings/format";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { getBookingStatusSurfaceClassName } from "@/components/shared/booking-status-tokens";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BookingCard({
  booking,
  muted = false,
}: {
  booking: EmployeeBooking;
  muted?: boolean;
}) {
  return (
    <article
      className={cn(
        "grid gap-3 rounded-lg border p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center",
        muted
          ? "border-slate-300 bg-slate-100 text-slate-600 opacity-80 ring-1 ring-slate-200/80 dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-300"
          : getBookingStatusSurfaceClassName(booking.status),
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <BookingStatusBadge status={booking.status} />
          <span className="opacity-80">
            {formatBookingDate(booking.startsAt)}
          </span>
        </div>

        <h3 className="mt-2 truncate text-base font-semibold tracking-normal">
          {booking.title}
        </h3>

        <div className="mt-3 grid gap-2 text-sm opacity-85 sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4" aria-hidden="true" />
            {booking.facility
              ? `${booking.facility.name}, ${booking.facility.level}`
              : "Room unavailable"}
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
          className: "w-full bg-background/80 sm:w-fit",
        })}
      >
        Open booking
        <ArrowRight data-icon="inline-end" />
      </Link>
    </article>
  );
}
