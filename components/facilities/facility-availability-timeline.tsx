import Link from "next/link";

import type { AvailabilityTimelineItem } from "@/lib/facilities/availability-timeline";
import { formatBookingWindow } from "@/lib/bookings/format";
import { buttonVariants } from "@/components/ui/button";

const typeClassNames: Record<AvailabilityTimelineItem["type"], string> = {
  available:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100",
  confirmed:
    "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/25 dark:text-sky-100",
  pending:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-100",
  maintenance:
    "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/25 dark:text-violet-100",
};

export function FacilityAvailabilityTimeline({
  facilityId,
  date,
  items,
  basePath,
}: {
  facilityId: string;
  date: string;
  items: AvailabilityTimelineItem[];
  basePath: string;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm shadow-primary/5 ring-1 ring-primary/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">
            Availability timeline
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing booked, pending, blocked, maintenance, and available periods.
          </p>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="facilityId" value={facilityId} />
          <label htmlFor="timeline-date" className="text-sm font-medium">
            Date
          </label>
          <input
            id="timeline-date"
            name="date"
            type="date"
            defaultValue={date}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button className={buttonVariants({ variant: "outline" })} type="submit">
            View
          </button>
        </form>
      </div>

      <div className="mt-5 grid gap-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className={`grid gap-2 rounded-lg border p-3 sm:grid-cols-[150px_120px_minmax(0,1fr)] sm:items-center ${typeClassNames[item.type]}`}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-sm">{formatBookingWindow(item.startsAt, item.endsAt)}</p>
              <p className="min-w-0 break-words text-sm text-current/80">
                {item.detail}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            No timeline data for this date.
          </p>
        )}
      </div>

      <div className="mt-4">
        <Link
          href={`${basePath}?date=${encodeURIComponent(date)}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Refresh timeline
        </Link>
      </div>
    </section>
  );
}
