"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

import type { AvailabilityTimelineItem } from "@/lib/facilities/availability-timeline";
import { formatBookingWindow } from "@/lib/bookings/format";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

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

type LoadState =
  | { status: "idle"; key: string; items: AvailabilityTimelineItem[]; message: string }
  | { status: "error"; key: string; items: AvailabilityTimelineItem[]; message: string }
  | { status: "success"; key: string; items: AvailabilityTimelineItem[]; message: string };

export function BookingAvailabilityTimeline({
  facilityId,
  facilityName,
  date,
}: {
  facilityId: string;
  facilityName?: string;
  date: string;
}) {
  const [state, setState] = useState<LoadState>({
    status: "idle",
    key: "",
    items: [],
    message: "Select a facility and date to view availability.",
  });
  const selectedKey = facilityId && date ? `${facilityId}:${date}` : "";
  const isLoading = Boolean(selectedKey && state.key !== selectedKey);

  useEffect(() => {
    if (!selectedKey) {
      return;
    }

    const controller = new AbortController();

    fetch(
      `/api/facility-availability?facilityId=${encodeURIComponent(
        facilityId,
      )}&date=${encodeURIComponent(date)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load availability.");
        }

        return (await response.json()) as {
          items?: AvailabilityTimelineItem[];
        };
      })
      .then((data) => {
        setState({
          status: "success",
          key: selectedKey,
          items: data.items ?? [],
          message:
            data.items?.length === 0
              ? "No timeline data for this date."
              : "Availability loaded.",
        });
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") {
          return;
        }

        setState({
          status: "error",
          key: selectedKey,
          items: [],
          message:
            "Unable to load availability. You can still submit; conflicts will be checked before booking is created.",
        });
      });

    return () => controller.abort();
  }, [date, facilityId, selectedKey]);

  return (
    <section
      className="grid gap-4 rounded-lg border border-border/70 bg-card p-4 shadow-sm ring-1 ring-primary/10 sm:col-span-2"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
          <CalendarClock className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold tracking-normal">
            Availability for selected date
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this timeline to choose a time that does not overlap with
            bookings, blocked periods, or maintenance.
          </p>
          {facilityName && date ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {facilityName} on {date}
            </p>
          ) : null}
        </div>
      </div>

      {!selectedKey ? (
        <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Select a facility and date to view availability.
        </p>
      ) : isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <LoadingSpinner size="sm" label="Loading availability" />
          <span>Loading availability...</span>
        </div>
      ) : state.status === "error" ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-100"
        >
          {state.message}
        </p>
      ) : (
        <div className="grid gap-2">
          {state.items.length > 0 ? (
            state.items.map((item) => (
              <div
                key={item.id}
                className={`grid gap-1 rounded-lg border p-3 text-sm sm:grid-cols-[7rem_8rem_minmax(0,1fr)] sm:items-center ${typeClassNames[item.type]}`}
              >
                <p className="font-semibold">{item.label}</p>
                <p>{formatBookingWindow(item.startsAt, item.endsAt)}</p>
                <p className="min-w-0 break-words text-current/80">
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
      )}
    </section>
  );
}
