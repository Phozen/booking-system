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
  bookDayHref,
}: {
  day: CalendarDay;
  bookings: CalendarBooking[];
  bookDayHref?: string | null;
}) {
  const headingId = `calendar-day-${day.key}-heading`;
  const resolvedBookDayHref =
    bookDayHref === undefined
      ? `/bookings/new?date=${encodeURIComponent(day.key)}`
      : bookDayHref;
  const showBookDayAction = resolvedBookDayHref !== null;

  return (
    <aside
      className="grid gap-4 self-start rounded-lg border border-border bg-card p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
      aria-labelledby={headingId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id={headingId} className="qbook-type-section">
            {formatDayPanelTitle(day)}
          </h2>
          <p className="qbook-type-meta mt-1 qbook-type-tabular">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </p>
        </div>
        {showBookDayAction ? (
          <Link
            href={resolvedBookDayHref}
            className={buttonVariants({ size: "sm", className: "shrink-0" })}
          >
            <CalendarPlus data-icon="inline-start" aria-hidden="true" />
            Book this day
          </Link>
        ) : null}
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
            showBookDayAction ? (
              <Link
                href={resolvedBookDayHref}
                className={buttonVariants()}
              >
                <CalendarPlus data-icon="inline-start" aria-hidden="true" />
                Book this day
              </Link>
            ) : undefined
          }
        />
      )}
    </aside>
  );
}
