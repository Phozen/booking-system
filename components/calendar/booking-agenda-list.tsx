import type { CalendarDay } from "@/lib/calendar/date-range";
import type { GroupedCalendarBookings } from "@/lib/calendar/group-bookings";
import { CalendarBookingItem } from "@/components/calendar/calendar-booking-item";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

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
      <h2 id="agenda-heading" className="qbook-type-section">
        Agenda
      </h2>

      {daysWithBookings.length > 0 ? (
        daysWithBookings.map((day) => (
          <section
            key={day.key}
            className="grid gap-3 border-b border-border pb-4 last:border-b-0"
          >
            <div>
              <h3 className="font-medium tracking-normal">{day.shortLabel}</h3>
              <p className="qbook-type-meta qbook-type-tabular">
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
          description="Nothing matches these filters. Clear filters or create a booking."
          action={
            <Link
              href="/bookings/new"
              className={buttonVariants({ size: "sm" })}
            >
              Create booking
            </Link>
          }
        />
      )}
    </section>
  );
}
