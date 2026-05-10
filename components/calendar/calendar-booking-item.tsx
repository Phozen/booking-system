import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, UserRound } from "lucide-react";

import { formatBookingDate, formatBookingWindow } from "@/lib/bookings/format";
import type { CalendarBooking } from "@/lib/calendar/group-bookings";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

export function CalendarBookingItem({
  booking,
  compact,
}: {
  booking: CalendarBooking;
  compact?: boolean;
}) {
  return (
    <Link
      href={booking.href}
      className={cn(
        "group grid gap-2 rounded-lg border border-border/70 bg-background p-3 text-sm shadow-sm ring-1 ring-primary/5 transition-all hover:border-primary/40 hover:bg-accent/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
        compact ? "p-2 text-xs" : "",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 break-words font-medium leading-5 text-foreground">
          {booking.title}
        </span>
        <StatusBadge kind="booking" status={booking.status} />
      </div>

      <dl className="grid min-w-0 gap-1 break-words text-muted-foreground">
        {!compact ? (
          <div className="inline-flex items-center gap-2">
            <CalendarClock className="size-4" aria-hidden="true" />
            <span>
              {formatBookingDate(booking.startsAt)},{" "}
              {formatBookingWindow(booking.startsAt, booking.endsAt)}
            </span>
          </div>
        ) : (
          <div>{formatBookingWindow(booking.startsAt, booking.endsAt)}</div>
        )}
        <div className="inline-flex items-center gap-2">
          <MapPin
            className={cn("size-4", compact ? "hidden" : "")}
            aria-hidden="true"
          />
          <span>
            {booking.facilityName}, {booking.facilityLevel}
            {booking.facilityType ? ` - ${booking.facilityType}` : ""}
          </span>
        </div>
        {booking.userLabel ? (
          <div className="inline-flex items-center gap-2">
            <UserRound
              className={cn("size-4", compact ? "hidden" : "")}
              aria-hidden="true"
            />
            <span>{booking.userLabel}</span>
          </div>
        ) : null}
        {typeof booking.approvalRequired === "boolean" ? (
          <div>
            Approval {booking.approvalRequired ? "required" : "not required"}
          </div>
        ) : null}
      </dl>

      {!compact ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          View details
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </Link>
  );
}
