"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { AlertCircle, CalendarClock, Loader2, Minus, Plus } from "lucide-react";

import type { AvailabilityTimelineItem } from "@/lib/facilities/availability-timeline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BOOKING_WORKING_HOURS_END,
  BOOKING_WORKING_HOURS_LABEL,
  BOOKING_WORKING_HOURS_START,
} from "@/lib/bookings/validation";

const STEP_MINUTES = 30;
const DEFAULT_DURATION_MINUTES = 60;
const WORKING_START_MINUTES = parseTime(BOOKING_WORKING_HOURS_START) ?? 7 * 60 + 30;
const WORKING_END_MINUTES = parseTime(BOOKING_WORKING_HOURS_END) ?? 21 * 60;

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

function clampToWorkingHours(minutes: number) {
  return Math.max(
    WORKING_START_MINUTES,
    Math.min(WORKING_END_MINUTES, minutes),
  );
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
      return "border-red-600 bg-red-200 text-red-950 shadow-red-900/20 dark:border-red-500 dark:bg-red-950/80 dark:text-red-50";
    case "pending":
      return "border-amber-600 bg-amber-200 text-amber-950 shadow-amber-900/20 dark:border-amber-500 dark:bg-amber-950/80 dark:text-amber-50";
    case "blocked":
      return "border-slate-600 bg-slate-300 text-slate-950 shadow-slate-900/20 dark:border-slate-400 dark:bg-slate-800 dark:text-slate-50";
    case "maintenance":
      return "border-purple-600 bg-purple-200 text-purple-950 shadow-purple-900/20 dark:border-purple-500 dark:bg-purple-950/80 dark:text-purple-50";
  }
}

export function BookingAvailabilityTimeline({
  facilityId,
  facilityName,
  date,
  timezone,
  startTime,
  endTime,
  onTimeChange,
  disabled = false,
  locked = false,
  startTimeError,
  endTimeError,
}: {
  facilityId: string;
  facilityName?: string;
  date: string;
  timezone: string;
  startTime: string;
  endTime: string;
  onTimeChange: (startTime: string, endTime: string) => void;
  disabled?: boolean;
  locked?: boolean;
  startTimeError?: string;
  endTimeError?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
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
        .filter((item) => item.type !== "available")
        .map((item) => ({
          id: item.id,
          type: item.type,
          label: item.label,
          detail: item.detail,
          start: getLocalMinutes(item.startsAt, timezone),
          end: getLocalMinutes(item.endsAt, timezone),
        }))
        .filter((item): item is BusyBlock => item.end > item.start)
        .filter(
          (item) =>
            item.end > WORKING_START_MINUTES &&
            item.start < WORKING_END_MINUTES,
        )
        .sort((a, b) => a.start - b.start),
    [timelineItems, timezone],
  );

  const selectedStart = parseTime(startTime);
  const selectedEnd = parseTime(endTime);
  const hasSelection =
    selectedStart !== null && selectedEnd !== null && selectedEnd > selectedStart;

  const windowStart = WORKING_START_MINUTES;
  const windowEnd = WORKING_END_MINUTES;
  const windowMinutes = Math.max(60, windowEnd - windowStart);
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

  function adjust(edge: "start" | "end", delta: number) {
    const start = selectedStart ?? WORKING_START_MINUTES;
    const end = selectedEnd ?? start + DEFAULT_DURATION_MINUTES;

    if (edge === "start") {
      commitRange(start + delta, end);
    } else {
      commitRange(start, end + delta);
    }
  }

  const firstFullHour = Math.ceil(WORKING_START_MINUTES / 60) * 60;
  const hourMarks = [
    WORKING_START_MINUTES,
    ...Array.from(
      { length: Math.floor((WORKING_END_MINUTES - firstFullHour) / 60) + 1 },
      (_, index) => firstFullHour + index * 60,
    ),
  ].filter((minute, index, minutes) => minutes.indexOf(minute) === index);

  return (
    <section className="grid gap-3 border-y border-border/80 bg-muted/15 py-4 sm:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-medium tracking-normal">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
            Availability and time
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a date first, then choose times between {BOOKING_WORKING_HOURS_LABEL}.
          </p>
        </div>
        <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
          30 min blocks
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
          <div className="hidden text-xs text-muted-foreground lg:block">
            {hourMarks.map((minute) => (
              <div
                key={minute}
                className="relative"
                style={{ height: `${Math.max(40, 720 / hourMarks.length)}px` }}
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
              "relative min-h-[520px] overflow-hidden rounded-lg border bg-background touch-none",
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
                  top: `${((clampToWorkingHours(block.start) - windowStart) / windowMinutes) * 100}%`,
                  height: `${Math.max(7, ((clampToWorkingHours(block.end) - clampToWorkingHours(block.start)) / windowMinutes) * 100)}%`,
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
                  "absolute left-6 right-6 z-10 cursor-grab rounded-md border-2 px-3 py-2 text-sm shadow-md active:cursor-grabbing sm:left-10",
                  hasSelectionConflict
                    ? "border-destructive bg-destructive/15 text-destructive"
                    : "border-primary bg-primary/15 text-primary",
                )}
                style={{
                  top: `${((clampToWorkingHours(selectedStart) - windowStart) / windowMinutes) * 100}%`,
                  height: `${Math.max(8, ((clampToWorkingHours(selectedEnd) - clampToWorkingHours(selectedStart)) / windowMinutes) * 100)}%`,
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

      <div className="grid gap-3 bg-background/70 p-3 ring-1 ring-border/70 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startTime" className="text-xs font-medium uppercase text-muted-foreground">
            Start time
          </Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            step={STEP_MINUTES * 60}
            min={BOOKING_WORKING_HOURS_START}
            max={BOOKING_WORKING_HOURS_END}
            value={startTime}
            onChange={(event) => onTimeChange(event.target.value, endTime)}
            disabled={controlsDisabled || !date}
            aria-invalid={Boolean(startTimeError)}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjust("start", -STEP_MINUTES)}
              disabled={controlsDisabled || !date}
              aria-label="Move start time earlier by 30 minutes"
            >
              <Minus className="size-4" aria-hidden="true" />
            </Button>
            <span className="min-w-20 text-center font-medium">
              {startTime || "--:--"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjust("start", STEP_MINUTES)}
              disabled={controlsDisabled || !date}
              aria-label="Move start time later by 30 minutes"
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {startTimeError ? (
            <p className="text-sm text-destructive">{startTimeError}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endTime" className="text-xs font-medium uppercase text-muted-foreground">
            End time
          </Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            step={STEP_MINUTES * 60}
            min={BOOKING_WORKING_HOURS_START}
            max={BOOKING_WORKING_HOURS_END}
            value={endTime}
            onChange={(event) => onTimeChange(startTime, event.target.value)}
            disabled={controlsDisabled || !date}
            aria-invalid={Boolean(endTimeError)}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjust("end", -STEP_MINUTES)}
              disabled={controlsDisabled || !date}
              aria-label="Move end time earlier by 30 minutes"
            >
              <Minus className="size-4" aria-hidden="true" />
            </Button>
            <span className="min-w-20 text-center font-medium">
              {endTime || "--:--"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjust("end", STEP_MINUTES)}
              disabled={controlsDisabled || !date}
              aria-label="Move end time later by 30 minutes"
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {endTimeError ? (
            <p className="text-sm text-destructive">{endTimeError}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
