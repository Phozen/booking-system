import type { CalendarDay } from "@/lib/calendar/date-range";
import type { GroupedCalendarBookings } from "@/lib/calendar/group-bookings";
import { CalendarBookingItem } from "@/components/calendar/calendar-booking-item";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendarGrid({
  days,
  groupedBookings,
}: {
  days: CalendarDay[];
  groupedBookings: GroupedCalendarBookings;
}) {
  const hasBookings = Object.values(groupedBookings).some(
    (bookings) => bookings.length > 0,
  );

  return (
    <section className="hidden overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm md:block">
      <div className="border-b bg-muted/25 p-4">
        <h2 className="font-semibold tracking-normal">Month view</h2>
        <p className="text-sm text-muted-foreground">
          Booking items are links. Days without bookings remain visible for
          orientation.
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

      <div className="grid grid-cols-7 border-b bg-secondary/70 text-xs font-semibold uppercase text-muted-foreground">
        {weekDays.map((day) => (
          <div key={day} className="border-r px-3 py-2 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const bookings = groupedBookings[day.key] ?? [];

          return (
            <div
              key={day.key}
              className={cn(
                "min-h-36 border-r border-t bg-background/60 p-2 last:border-r-0",
                !day.isCurrentMonth && "bg-muted/35 text-muted-foreground",
                day.isToday && "bg-primary/5",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                    day.isToday &&
                      "bg-primary text-primary-foreground shadow-sm shadow-primary/20",
                  )}
                  aria-label={`${day.weekdayLabel}, ${day.shortLabel}`}
                >
                  {day.dateNumber}
                </span>
                {bookings.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {bookings.length} booking{bookings.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              <div className="grid max-h-28 gap-1 overflow-y-auto pr-1">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <CalendarBookingItem
                      key={booking.id}
                      booking={booking}
                      compact
                    />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No bookings</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
