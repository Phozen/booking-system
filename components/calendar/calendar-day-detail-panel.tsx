import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import type { CalendarDay } from "@/lib/calendar/date-range";
import type { CalendarBooking } from "@/lib/calendar/group-bookings";
import { formatBookingWindow } from "@/lib/bookings/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeStringToMinutes } from "@/lib/settings/app-settings";

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

function formatTimelineHour(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

type TimelineLayoutBlock = {
  booking: CalendarBooking;
  start: number;
  end: number;
  column: number;
  columns: number;
};

function layoutTimelineBlocks(
  bookings: CalendarBooking[],
  timezone: string,
  windowStart: number,
  windowEnd: number,
): TimelineLayoutBlock[] {
  const blocks = bookings
    .map((booking) => {
      const start = getLocalMinutes(booking.startsAt, timezone);
      return {
        booking,
        start,
        end: Math.max(start + 15, getLocalMinutes(booking.endsAt, timezone)),
      };
    })
    .filter(
      (block) =>
        block.end > windowStart &&
        block.start < windowEnd,
    )
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const clusters: (typeof blocks)[] = [];
  let currentCluster: typeof blocks = [];
  let clusterEnd = -1;

  for (const block of blocks) {
    if (currentCluster.length === 0 || block.start < clusterEnd) {
      currentCluster.push(block);
      clusterEnd = Math.max(clusterEnd, block.end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [block];
      clusterEnd = block.end;
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  return clusters.flatMap((cluster) => {
    const columnEnds: number[] = [];
    const assigned = cluster.map((block) => {
      const column = columnEnds.findIndex((end) => end <= block.start);
      const nextColumn = column === -1 ? columnEnds.length : column;
      columnEnds[nextColumn] = block.end;
      return { ...block, column: nextColumn };
    });
    const columns = Math.max(1, columnEnds.length);

    return assigned.map((block) => ({
      ...block,
      columns,
    }));
  });
}

function TimelineBlock({
  block,
  windowStart,
  windowEnd,
}: {
  block: TimelineLayoutBlock;
  windowStart: number;
  windowEnd: number;
}) {
  const windowMinutes = Math.max(60, windowEnd - windowStart);
  const visibleStart = Math.max(block.start, windowStart);
  const visibleEnd = Math.min(block.end, windowEnd);
  const top = ((visibleStart - windowStart) / windowMinutes) * 100;
  const height = ((visibleEnd - visibleStart) / windowMinutes) * 100;
  const width = 100 / block.columns;
  const left = block.column * width;

  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-md border px-2 py-1.5 text-xs leading-tight shadow-sm",
        block.booking.status === "confirmed"
          ? "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"
          : "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
      )}
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `calc(${width}% - 0.25rem)`,
        height: `calc(${Math.max(height, 4)}% - 0.125rem)`,
      }}
    >
      <p className="truncate font-medium">{block.booking.title}</p>
      <p className="truncate opacity-80">
        {formatBookingWindow(block.booking.startsAt, block.booking.endsAt)}
      </p>
    </div>
  );
}

export function CalendarDayDetailPanel({
  day,
  bookings,
  timezone,
  bookingWindowStart,
  bookingWindowEnd,
}: {
  day: CalendarDay;
  bookings: CalendarBooking[];
  timezone: string;
  bookingWindowStart: string;
  bookingWindowEnd: string;
}) {
  const windowStart = timeStringToMinutes(bookingWindowStart);
  const windowEnd = timeStringToMinutes(bookingWindowEnd);
  const windowMinutes = Math.max(60, windowEnd - windowStart);
  const firstFullTwoHour = Math.ceil(windowStart / 120) * 120;
  const hourMarks = [
    windowStart,
    ...Array.from(
      { length: Math.floor((windowEnd - firstFullTwoHour) / 120) + 1 },
      (_, index) => firstFullTwoHour + index * 120,
    ),
    windowEnd,
  ].filter((minute, index, minutes) => minutes.indexOf(minute) === index);
  const timelineBlocks = layoutTimelineBlocks(
    bookings,
    timezone,
    windowStart,
    windowEnd,
  );

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
              <div
                key={booking.id}
                className="grid gap-2 rounded-lg border border-border/70 bg-background p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{booking.title}</span>
                  <StatusBadge kind="booking" status={booking.status} />
                </div>
                <dl className="grid gap-1 text-muted-foreground">
                  <div>
                    <dt className="sr-only">Time</dt>
                    <dd>{formatBookingWindow(booking.startsAt, booking.endsAt)}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Location</dt>
                    <dd>
                      {booking.facilityName}, {booking.facilityLevel}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div className="relative min-h-[840px] rounded-lg border bg-background">
            {hourMarks.map((minute) => (
              <div
                key={minute}
                className="absolute inset-x-0 border-t border-border/60"
                style={{
                  top: `${((minute - windowStart) / windowMinutes) * 100}%`,
                }}
              >
                <span
                  className={cn(
                    "absolute left-2 text-[0.7rem] text-muted-foreground",
                    minute === windowEnd
                      ? "-top-1 -translate-y-full"
                      : "top-1",
                  )}
                >
                  {formatTimelineHour(minute)}
                </span>
              </div>
            ))}
            <div className="absolute bottom-0 left-16 right-2 top-0">
              {timelineBlocks.map((block) => (
                <TimelineBlock
                  key={block.booking.id}
                  block={block}
                  windowStart={windowStart}
                  windowEnd={windowEnd}
                />
              ))}
            </div>
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
