import type { CalendarDay } from "@/lib/calendar/date-range";
import type { GroupedCalendarBookings } from "@/lib/calendar/group-bookings";
import { CalendarBookingItem } from "@/components/calendar/calendar-booking-item";
import { EmptyState } from "@/components/shared/empty-state";

export function BookingAgendaList({
  days,
  groupedBookings,
}: {
  days: CalendarDay[];
  groupedBookings: GroupedCalendarBookings;
}) {
  const currentMonthDays = days.filter((day) => day.isCurrentMonth);
  const daysWithBookings = currentMonthDays.filter(
    (day) => (groupedBookings[day.key] ?? []).length > 0,
  );

  return (
    <section className="grid gap-4 md:hidden" aria-labelledby="agenda-heading">
      <div>
        <h2 id="agenda-heading" className="font-semibold tracking-normal">
          Agenda view
        </h2>
        <p className="text-sm text-muted-foreground">
          Mobile view groups bookings by date so each item stays easy to open.
        </p>
      </div>

      {daysWithBookings.length > 0 ? (
        daysWithBookings.map((day) => (
          <section
            key={day.key}
            className="grid gap-3 rounded-lg border border-border/70 bg-card p-4 shadow-sm"
          >
            <div>
              <h3 className="font-medium tracking-normal">{day.shortLabel}</h3>
              <p className="text-sm text-muted-foreground">
                {(groupedBookings[day.key] ?? []).length} booking
                {(groupedBookings[day.key] ?? []).length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="grid gap-2">
              {(groupedBookings[day.key] ?? []).map((booking) => (
                <CalendarBookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <EmptyState
          title="No bookings this month"
          description="There are no bookings matching the selected month and filters."
        />
      )}
    </section>
  );
}
