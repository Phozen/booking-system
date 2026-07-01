import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import type { CalendarDay } from "@/lib/calendar/date-range";
import type { CalendarBooking } from "@/lib/calendar/group-bookings";
import { formatBookingWindow } from "@/lib/bookings/format";
import { CalendarBookingItem } from "@/components/calendar/calendar-booking-item";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getLocalMinutes(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return Math.min(24 * 60, Math.max(0, (hour === 24 ? 0 : hour) * 60 + minute));
}

function TimelineBlock({
  booking,
  timezone,
}: {
  booking: CalendarBooking;
  timezone: string;
}) {
  const start = getLocalMinutes(booking.startsAt, timezone);
  const end = Math.max(start + 15, getLocalMinutes(booking.endsAt, timezone));
  const top = (start / 1440) * 100;
  const height = ((Math.min(end, 1440) - start) / 1440) * 100;

  return (
    <div
      className={cn(
        "absolute left-16 right-2 rounded-md border px-2 py-1 text-xs shadow-sm",
        booking.status === "confirmed"
          ? "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"
          : "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
      )}
      style={{
        top: `${top}%`,
        minHeight: "1.75rem",
        height: `${Math.max(height, 3)}%`,
      }}
    >
      <p className="truncate font-medium">{booking.title}</p>
      <p className="truncate opacity-80">
        {formatBookingWindow(booking.startsAt, booking.endsAt)}
      </p>
    </div>
  );
}

export function CalendarDayDetailPanel({
  day,
  bookings,
  timezone,
}: {
  day: CalendarDay;
  bookings: CalendarBooking[];
  timezone: string;
}) {
  const hourMarks = Array.from({ length: 13 }, (_, index) => index * 2);

  return (
    <aside className="grid gap-4 rounded-lg border border-border/70 bg-card p-4 shadow-sm shadow-primary/5 ring-1 ring-primary/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Selected day
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-normal">
            {day.weekdayLabel}, {day.shortLabel}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"} shown.
          </p>
        </div>
        <Link
          href={`/bookings/new?date=${encodeURIComponent(day.key)}`}
          className={buttonVariants({ size: "sm" })}
        >
          <CalendarPlus data-icon="inline-start" />
          Book on this day
        </Link>
      </div>

      {bookings.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-2">
            {bookings.map((booking) => (
              <CalendarBookingItem key={booking.id} booking={booking} />
            ))}
          </div>

          <div className="relative min-h-[560px] rounded-lg border bg-background">
            {hourMarks.map((hour) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-border/60"
                style={{ top: `${(hour / 24) * 100}%` }}
              >
                <span className="absolute left-2 top-1 text-[0.7rem] text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
            ))}
            {bookings.map((booking) => (
              <TimelineBlock
                key={booking.id}
                booking={booking}
                timezone={timezone}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No bookings on this day"
          description="Use the booking action to create a room booking for this date."
          action={
            <Link
              href={`/bookings/new?date=${encodeURIComponent(day.key)}`}
              className={buttonVariants()}
            >
              <CalendarPlus data-icon="inline-start" />
              Book on this day
            </Link>
          }
        />
      )}
    </aside>
  );
}
