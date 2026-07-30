import Link from "next/link";

import type { CalendarDay } from "@/lib/calendar/date-range";
import type { GroupedCalendarBookings } from "@/lib/calendar/group-bookings";
import { CalendarBookingItem } from "@/components/calendar/calendar-booking-item";
import { cn } from "@/lib/utils";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendarGrid({
  days,
  groupedBookings,
  selectedDate,
  getDayHref,
}: {
  days: CalendarDay[];
  groupedBookings: GroupedCalendarBookings;
  selectedDate?: string;
  getDayHref?: (dayKey: string) => string;
}) {
  const hasBookings = Object.values(groupedBookings).some(
    (bookings) => bookings.length > 0,
  );
  const leadingPlaceholderCount = days[0]?.weekdayIndex ?? 0;

  return (
    <section className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
        {weekDays.map((day) => (
          <div key={day} className="border-r border-border/60 px-3 py-2 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: leadingPlaceholderCount }, (_, index) => (
          <div
            key={`leading-placeholder-${index}`}
            className="min-h-36 border-r border-t border-border/50 bg-muted/15 p-2 last:border-r-0"
            aria-hidden="true"
          />
        ))}
        {days.map((day) => {
          const bookings = groupedBookings[day.key] ?? [];
          const isSelected = selectedDate === day.key;

          return (
            <div
              key={day.key}
              className={cn(
                "relative min-h-36 border-r border-t border-border/70 bg-background p-2 last:border-r-0",
                day.isToday && "bg-primary/5",
                isSelected && "bg-accent/50 ring-2 ring-inset ring-primary/40",
              )}
            >
              {getDayHref ? (
                <Link
                  href={getDayHref(day.key)}
                  prefetch={false}
                  scroll={false}
                  className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
                  aria-label={`Select ${day.weekdayLabel}, ${day.shortLabel}`}
                  aria-current={isSelected ? "date" : undefined}
                />
              ) : null}
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "relative z-10 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold qbook-type-tabular",
                    (day.isToday || isSelected) &&
                      "bg-primary text-primary-foreground",
                  )}
                  aria-label={`${day.weekdayLabel}, ${day.shortLabel}`}
                >
                  {day.dateNumber}
                </span>
                {bookings.length > 0 ? (
                  <span className="relative z-10 qbook-type-meta qbook-type-tabular">
                    {bookings.length}
                  </span>
                ) : null}
              </div>

              <div className="pointer-events-none relative z-10 grid gap-1 pr-1">
                {bookings.length > 0 ? (
                  bookings.slice(0, 2).map((booking) => (
                    <CalendarBookingItem
                      key={booking.id}
                      booking={booking}
                      compact
                    />
                  ))
                ) : null}
                {bookings.length > 2 ? (
                  <span className="qbook-type-meta font-medium text-primary">
                    +{bookings.length - 2} more
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {!hasBookings ? (
        <p className="sr-only">No bookings this month for the selected filters.</p>
      ) : null}
    </section>
  );
}
