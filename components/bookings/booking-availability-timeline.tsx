"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import type { AvailabilityTimelineItem } from "@/lib/facilities/availability-timeline";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBookingStatusSurfaceClassName } from "@/components/shared/booking-status-tokens";
import {
  timeStringToMinutes,
} from "@/lib/settings/app-settings";

const STEP_MINUTES = 30;
const DEFAULT_DURATION_MINUTES = 60;

type AvailabilityResponse = {
  items?: AvailabilityTimelineItem[];
  error?: string;
};

type BusyBlock = {
  id: string;
  type: Exclude<AvailabilityTimelineItem["type"], "available">;
  label: string;
  detail: string | null;
  start: number;
  end: number;
};

type DragState =
  | { mode: "create"; anchor: number }
  | { mode: "move"; pointerStart: number; start: number; end: number }
  | { mode: "resize-start"; pointerStart: number; start: number; end: number }
  | { mode: "resize-end"; pointerStart: number; start: number; end: number };

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour * 60 + minute;
}

function formatTime(minutes: number) {
  const clamped = Math.max(0, Math.min(24 * 60 - STEP_MINUTES, minutes));
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function roundToStep(minutes: number) {
  return Math.round(minutes / STEP_MINUTES) * STEP_MINUTES;
}

function getLocalMinutes(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );

  return (hour === 24 ? 0 : hour) * 60 + minute;
}

function overlaps(start: number, end: number, blocks: BusyBlock[]) {
  return blocks.some((block) => start < block.end && end > block.start);
}

function blockColor(type: BusyBlock["type"]) {
  switch (type) {
    case "confirmed":
      return getBookingStatusSurfaceClassName("confirmed");
    case "pending":
      return getBookingStatusSurfaceClassName("pending");
    case "blocked":
      return "border-rose-600 bg-rose-200 text-rose-950 shadow-rose-900/20 dark:border-rose-500 dark:bg-rose-950/80 dark:text-rose-50";
    case "maintenance":
      return "border-purple-600 bg-purple-200 text-purple-950 shadow-purple-900/20 dark:border-purple-500 dark:bg-purple-950/80 dark:text-purple-50";
  }
}

export function BookingAvailabilityTimeline({
  facilityId,
  facilityName,
  date,
  timezone,
  bookingWindowStart,
  bookingWindowEnd,
  startTime,
  endTime,
  onTimeChange,
  disabled = false,
  locked = false,
  startTimeError,
  endTimeError,
  currentBookingId,
}: {
  facilityId: string;
  facilityName?: string;
  date: string;
  timezone: string;
  bookingWindowStart: string;
  bookingWindowEnd: string;
  startTime: string;
  endTime: string;
  onTimeChange: (startTime: string, endTime: string) => void;
  disabled?: boolean;
  locked?: boolean;
  startTimeError?: string;
  endTimeError?: string;
  currentBookingId?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const windowStart = timeStringToMinutes(bookingWindowStart);
  const windowEnd = timeStringToMinutes(bookingWindowEnd);
  const windowMinutes = Math.max(60, windowEnd - windowStart);
  function clampToBookingWindow(minutes: number) {
    return Math.max(windowStart, Math.min(windowEnd, minutes));
  }
  const [items, setItems] = useState<AvailabilityTimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId || !date) {
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError(null);
      }
    });

    fetch(
      `/api/facility-availability?facilityId=${encodeURIComponent(facilityId)}&date=${encodeURIComponent(date)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload = (await response.json()) as AvailabilityResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Availability could not be loaded.");
        }
        setItems(payload.items ?? []);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Availability could not be loaded.",
        );
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [facilityId, date]);

  const timelineItems = useMemo(
    () => (facilityId && date ? items : []),
    [date, facilityId, items],
  );

  const busyBlocks = useMemo(
    () =>
      timelineItems
        .filter((item) => item.type !== "available" && item.id !== currentBookingId)
        .map((item) => ({
          id: item.id,
          type: item.type,
          label: item.label,
          detail: item.detail,
          start: getLocalMinutes(item.startsAt, timezone),
          end: getLocalMinutes(item.endsAt, timezone),
        }))
        .filter((item): item is BusyBlock => item.end > item.start)
        .filter((item) => item.end > windowStart && item.start < windowEnd)
        .sort((a, b) => a.start - b.start),
    [timelineItems, timezone, windowEnd, windowStart, currentBookingId],
  );

  const selectedStart = parseTime(startTime);
  const selectedEnd = parseTime(endTime);
  const hasSelection =
    selectedStart !== null && selectedEnd !== null && selectedEnd > selectedStart;

  const hasSelectionConflict =
    hasSelection && overlaps(selectedStart, selectedEnd, busyBlocks);
  const controlsDisabled = disabled || locked;

  function minutesFromPointer(event: PointerEvent<HTMLDivElement>) {
    const element = trackRef.current;
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    return Math.max(
      windowStart,
      Math.min(windowEnd - STEP_MINUTES, roundToStep(windowStart + ratio * windowMinutes)),
    );
  }

  function commitRange(start: number, end: number) {
    const nextStart = Math.max(windowStart, Math.min(start, windowEnd - STEP_MINUTES));
    const nextEnd = Math.max(nextStart + STEP_MINUTES, Math.min(end, windowEnd));

    if (overlaps(nextStart, nextEnd, busyBlocks)) {
      return;
    }

    onTimeChange(formatTime(nextStart), formatTime(nextEnd));
  }

  function beginSelection(event: PointerEvent<HTMLDivElement>) {
    if (controlsDisabled || loading || !date || !facilityId) return;
    const minutes = minutesFromPointer(event);
    if (minutes === null) return;

    const end = Math.min(minutes + DEFAULT_DURATION_MINUTES, windowEnd);
    if (overlaps(minutes, end, busyBlocks)) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { mode: "create", anchor: minutes };
    commitRange(minutes, end);
  }

  function beginBlockDrag(
    event: PointerEvent<HTMLDivElement>,
    mode: "move" | "resize-start" | "resize-end",
  ) {
    if (controlsDisabled || selectedStart === null || selectedEnd === null) return;
    const pointerStart = minutesFromPointer(event);
    if (pointerStart === null) return;

    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      mode,
      pointerStart,
      start: selectedStart,
      end: selectedEnd,
    };
  }

  function moveSelection(event: PointerEvent<HTMLDivElement>) {
    const currentDrag = dragState.current;
    if (!currentDrag) return;
    const minutes = minutesFromPointer(event);
    if (minutes === null) return;

    if (currentDrag.mode === "create") {
      const start = Math.min(currentDrag.anchor, minutes);
      const end = Math.max(currentDrag.anchor + STEP_MINUTES, minutes + STEP_MINUTES);
      commitRange(start, end);
      return;
    }

    const delta = roundToStep(minutes - currentDrag.pointerStart);

    if (currentDrag.mode === "move") {
      commitRange(currentDrag.start + delta, currentDrag.end + delta);
      return;
    }

    if (currentDrag.mode === "resize-start") {
      commitRange(currentDrag.start + delta, currentDrag.end);
      return;
    }

    commitRange(currentDrag.start, currentDrag.end + delta);
  }

  function endSelection() {
    dragState.current = null;
  }

  const firstFullHour = Math.ceil(windowStart / 60) * 60;
  const hourMarks = [
    windowStart,
    ...Array.from(
      { length: Math.floor((windowEnd - firstFullHour) / 60) + 1 },
      (_, index) => firstFullHour + index * 60,
    ),
  ].filter((minute, index, minutes) => minutes.indexOf(minute) === index);

  return (
    <section className="grid gap-4 rounded-lg border border-border/75 bg-muted/15 p-4 shadow-sm sm:col-span-2 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold tracking-normal">Choose a time</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Enter start and end times, or drag across an available space below.
          </p>
        </div>
        <span className="w-fit rounded-full border border-border/75 bg-background px-3 py-1 text-xs text-muted-foreground">
          30-minute intervals
        </span>
      </div>

      <div className="grid gap-4 rounded-lg border border-border/70 bg-background p-4 sm:grid-cols-2">
        <div className="grid content-start gap-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            step={STEP_MINUTES * 60}
            min={bookingWindowStart}
            max={bookingWindowEnd}
            value={startTime}
            onChange={(event) => onTimeChange(event.target.value, endTime)}
            disabled={controlsDisabled || !date}
            aria-describedby={startTimeError ? "startTime-error" : undefined}
            aria-invalid={Boolean(startTimeError)}
          />
          {startTimeError ? (
            <p id="startTime-error" className="text-sm text-destructive">
              {startTimeError}
            </p>
          ) : null}
        </div>
        <div className="grid content-start gap-2">
          <Label htmlFor="endTime">End time</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            step={STEP_MINUTES * 60}
            min={bookingWindowStart}
            max={bookingWindowEnd}
            value={endTime}
            onChange={(event) => onTimeChange(startTime, event.target.value)}
            disabled={controlsDisabled || !date}
            aria-describedby={endTimeError ? "endTime-error" : undefined}
            aria-invalid={Boolean(endTimeError)}
          />
          {endTimeError ? (
            <p id="endTime-error" className="text-sm text-destructive">
              {endTimeError}
            </p>
          ) : null}
        </div>
      </div>

      {!date ? (
        <div className="rounded-lg bg-background/70 p-4 text-sm text-muted-foreground ring-1 ring-border/70">
          Choose a date to view availability for {facilityName ?? "this facility"}.
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[6rem_minmax(0,1fr)]">
          <div className="relative hidden min-h-[min(32rem,65svh)] text-xs text-muted-foreground lg:block">
            {hourMarks.map((minute) => (
              <div
                key={minute}
                className={cn(
                  "absolute left-0",
                  minute === windowStart
                    ? "top-0"
                    : minute === windowEnd
                      ? "-translate-y-full"
                      : "-translate-y-1/2",
                )}
                style={{
                  top: `${((minute - windowStart) / windowMinutes) * 100}%`,
                }}
              >
                {formatTime(minute)}
              </div>
            ))}
          </div>
          <div
            ref={trackRef}
            role="application"
            aria-label={`Availability timeline for ${facilityName ?? "selected facility"} on ${date}`}
            className={cn(
              "relative min-h-[min(32rem,65svh)] overflow-hidden rounded-lg border bg-background touch-none",
              controlsDisabled ? "opacity-60" : "cursor-crosshair",
            )}
            onPointerDown={beginSelection}
            onPointerMove={moveSelection}
            onPointerUp={endSelection}
            onPointerCancel={endSelection}
          >
            {hourMarks.slice(0, -1).map((minute) => (
              <div
                key={minute}
                className="absolute left-0 right-0 border-t border-border"
                style={{
                  top: `${((minute - windowStart) / windowMinutes) * 100}%`,
                }}
              >
                <span className="absolute left-2 top-1 rounded bg-background px-1 text-xs font-medium text-muted-foreground lg:hidden">
                  {formatTime(minute)}
                </span>
              </div>
            ))}
            {Array.from(
              { length: Math.floor(windowMinutes / STEP_MINUTES) },
              (_, index) => windowStart + index * STEP_MINUTES,
            ).map((minute) =>
              minute % 60 === 0 ? null : (
                <div
                  key={minute}
                  className="absolute left-14 right-0 border-t border-dashed border-border/60 sm:left-18"
                  style={{
                    top: `${((minute - windowStart) / windowMinutes) * 100}%`,
                  }}
                />
              ),
            )}

            {loading ? (
              <div className="absolute inset-0 z-20 grid place-items-center bg-background/80">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading availability
                </span>
              </div>
            ) : null}

            {busyBlocks.map((block) => (
              <div
                key={block.id}
                className={cn(
                  "absolute left-16 right-3 rounded-md border px-3 py-2 text-xs shadow-sm sm:left-20",
                  blockColor(block.type),
                )}
                style={{
                  top: `${((clampToBookingWindow(block.start) - windowStart) / windowMinutes) * 100}%`,
                  height: `${Math.max(7, ((clampToBookingWindow(block.end) - clampToBookingWindow(block.start)) / windowMinutes) * 100)}%`,
                }}
              >
                <div className="font-medium">
                  {formatTime(block.start)} - {formatTime(block.end)}
                </div>
                <div className="truncate">{block.detail ?? block.label}</div>
              </div>
            ))}

            {hasSelection ? (
              <div
                onPointerDown={(event) => beginBlockDrag(event, "move")}
                onPointerMove={moveSelection}
                onPointerUp={endSelection}
                onPointerCancel={endSelection}
                className={cn(
                  "absolute left-16 right-3 z-10 cursor-grab rounded-md border-2 px-3 py-2 text-sm shadow-md active:cursor-grabbing sm:left-20",
                  hasSelectionConflict
                    ? "border-destructive bg-destructive/15 text-destructive"
                    : "border-primary bg-primary/15 text-primary",
                )}
                style={{
                  top: `${((clampToBookingWindow(selectedStart) - windowStart) / windowMinutes) * 100}%`,
                  height: `${Math.max(8, ((clampToBookingWindow(selectedEnd) - clampToBookingWindow(selectedStart)) / windowMinutes) * 100)}%`,
                }}
              >
                <div className="font-semibold">
                  {startTime} - {endTime}
                </div>
                <div className="text-xs">
                  {hasSelectionConflict ? "Conflicts with unavailable time" : "Selected time"}
                </div>
                {(["resize-start", "resize-end"] as const).map((mode) => {
                  const isStart = mode === "resize-start";

                  return (
                    <div
                      key={mode}
                      className={cn(
                        "absolute left-0 right-0 flex cursor-ns-resize justify-center px-2",
                        isStart ? "-top-2" : "-bottom-2",
                      )}
                      onPointerDown={(event) => beginBlockDrag(event, mode)}
                    >
                      <span className="h-3 w-14 rounded-full border-2 border-primary bg-background shadow-sm" />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      )}

    </section>
  );
}
