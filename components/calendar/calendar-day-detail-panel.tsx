import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import type { CalendarDay } from "@/lib/calendar/date-range";
import type { CalendarBooking } from "@/lib/calendar/group-bookings";
import { CalendarBookingItem } from "@/components/calendar/calendar-booking-item";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

/** Prefer "Thursday, 30 Jul" over "Thursday, Thu, 30 Jul". */
function formatDayPanelTitle(day: CalendarDay) {
  const monthDay = day.shortLabel.replace(/^[^,]+,\s*/, "");
  return `${day.weekdayLabel}, ${monthDay}`;
}

export function CalendarDayDetailPanel({
  day,
  bookings,
}: {
  day: CalendarDay;
  bookings: CalendarBooking[];
}) {
  return (
    <aside className="hidden gap-4 self-start rounded-lg border border-border bg-card p-4 md:grid lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="qbook-type-section">{formatDayPanelTitle(day)}</h2>
          <p className="qbook-type-meta mt-1 qbook-type-tabular">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href={`/bookings/new?date=${encodeURIComponent(day.key)}`}
          className={buttonVariants({ size: "sm", className: "shrink-0" })}
        >
          <CalendarPlus data-icon="inline-start" />
          Book this day
        </Link>
      </div>

      {bookings.length > 0 ? (
        <ul className="grid gap-2">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <CalendarBookingItem booking={booking} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No bookings on this day"
          action={
            <Link
              href={`/bookings/new?date=${encodeURIComponent(day.key)}`}
              className={buttonVariants()}
            >
              <CalendarPlus data-icon="inline-start" />
              Book this day
            </Link>
          }
        />
      )}
    </aside>
  );
}
