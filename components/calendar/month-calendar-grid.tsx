import Link from "next/link";

import type { CalendarDay } from "@/lib/calendar/date-range";
import type { GroupedCalendarBookings } from "@/lib/calendar/group-bookings";
import { CalendarBookingItem } from "@/components/calendar/calendar-booking-item";
import { EmptyState } from "@/components/shared/empty-state";
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
    <section className="hidden overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm shadow-primary/5 ring-1 ring-primary/10 md:block">
      <div className="border-b border-border/70 bg-gradient-to-r from-sky-50 via-card to-card p-4 dark:from-sky-950/25">
        <h2 className="font-semibold tracking-normal">Month view</h2>
        <p className="text-sm text-muted-foreground">
          Booking items are links. Only dates in the selected month are shown.
        </p>
      </div>

      {!hasBookings ? (
        <div className="p-4">
          <EmptyState
            title="No bookings this month"
            description="There are no bookings matching the selected month and filters."
          />
        </div>
      ) : null}

      <div className="grid grid-cols-7 border-b border-border/70 bg-secondary/80 text-xs font-semibold uppercase text-muted-foreground">
        {weekDays.map((day) => (
          <div key={day} className="border-r px-3 py-2 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: leadingPlaceholderCount }, (_, index) => (
          <div
            key={`leading-placeholder-${index}`}
            className="min-h-36 border-r border-t border-border/50 bg-muted/20 p-2 last:border-r-0"
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
                "relative min-h-36 border-r border-t border-border/70 bg-background/70 p-2 last:border-r-0",
                day.isToday && "bg-primary/10 ring-1 ring-inset ring-primary/30",
                isSelected && "bg-accent/60 ring-2 ring-inset ring-primary/50",
              )}
            >
              {getDayHref ? (
                <Link
                  href={getDayHref(day.key)}
                  scroll={false}
                  className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
                  aria-label={`Select ${day.weekdayLabel}, ${day.shortLabel}`}
                  aria-current={isSelected ? "date" : undefined}
                />
              ) : null}
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "relative z-10 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                    day.isToday &&
                      "bg-primary text-primary-foreground shadow-sm shadow-primary/20",
                    isSelected &&
                      "bg-primary text-primary-foreground shadow-sm shadow-primary/20",
                  )}
                  aria-label={`${day.weekdayLabel}, ${day.shortLabel}`}
                >
                  {day.dateNumber}
                </span>
                {bookings.length > 0 ? (
                  <span className="relative z-10 text-xs text-muted-foreground">
                    {bookings.length} booking{bookings.length === 1 ? "" : "s"}
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
                ) : (
                  <p className="text-xs text-muted-foreground">No bookings</p>
                )}
                {bookings.length > 2 ? (
                  <span className="text-xs font-medium text-primary">
                    View {bookings.length - 2} more
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
