import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";

import {
  formatBookingDate,
  formatBookingWindow,
} from "@/lib/bookings/format";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getBookingCardTone(status: EmployeeBooking["status"]) {
  switch (status) {
    case "confirmed":
      return "border-emerald-300 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/70 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100";
    case "pending":
      return "border-amber-300 bg-amber-50 text-amber-950 ring-1 ring-amber-200/70 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-100";
    case "cancelled":
      return "border-red-300 bg-red-50 text-red-950 ring-1 ring-red-200/70 dark:border-red-900 dark:bg-red-950/25 dark:text-red-100";
    case "rejected":
      return "border-slate-300 bg-slate-100 text-slate-800 ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900/45 dark:text-slate-200";
    default:
      return "border-slate-300 bg-slate-50 text-slate-800 ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900/35 dark:text-slate-200";
  }
}

export function BookingCard({ booking }: { booking: EmployeeBooking }) {
  return (
    <article
      className={cn(
        "grid gap-3 rounded-lg border p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center",
        getBookingCardTone(booking.status),
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
