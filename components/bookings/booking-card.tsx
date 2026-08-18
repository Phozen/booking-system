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
  highlighted = false,
}: {
  booking: EmployeeBooking;
  muted?: boolean;
  highlighted?: boolean;
}) {
  const titleId = `booking-${booking.id}-title`;

  return (
    <article
      id={`booking-${booking.id}`}
      aria-labelledby={titleId}
      className={cn(
        "group qbook-elevate scroll-mt-24 grid gap-3 rounded-lg border p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center",
        muted
          ? "border-slate-300 bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-200"
          : getBookingStatusSurfaceClassName(booking.status),
        highlighted &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <BookingStatusBadge status={booking.status} />
          <span className="text-muted-foreground">
            {formatBookingDate(booking.startsAt)}
          </span>
        </div>

        <h3
          id={titleId}
          className="mt-2 truncate text-base font-semibold tracking-normal"
        >
          {booking.title}
        </h3>

        <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="inline-flex min-w-0 items-center gap-2">
            <dt className="sr-only">Room</dt>
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <dd className="min-w-0 truncate">
              {booking.facility
                ? `${booking.facility.name}, ${booking.facility.level}`
                : "Room unavailable"}
            </dd>
          </div>
          <div className="inline-flex min-w-0 items-center gap-2">
            <dt className="sr-only">Time</dt>
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
            <dd className="min-w-0 qbook-type-tabular">
              {formatBookingWindow(booking.startsAt, booking.endsAt)}
            </dd>
          </div>
        </dl>
      </div>

      <Link
        href={`/bookings/${booking.id}`}
        className={buttonVariants({
          variant: "outline",
          className: "w-full bg-background/80 sm:w-fit",
        })}
      >
        Open booking
        <ArrowRight
          data-icon="inline-end"
          className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
        />
      </Link>
    </article>
  );
}
