"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  FileText,
  ListChecks,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  title: string;
  body: string;
  tip: string;
  icon: typeof DoorOpen;
  preview: ReactNode;
};

function PreviewChrome({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)] outline outline-1 outline-black/5 dark:outline-white/10">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-3.5 py-2.5">
        <span className="size-2 rounded-full bg-destructive/50" aria-hidden="true" />
        <span className="size-2 rounded-full bg-warning/60" aria-hidden="true" />
        <span className="size-2 rounded-full bg-success/60" aria-hidden="true" />
        <span className="ml-2 truncate text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="bg-gradient-to-b from-background to-muted/20 p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
}

function FieldStub({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <div className={cn("grid gap-1.5", wide && "sm:col-span-2")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="h-9 rounded-lg border border-border/80 bg-background/90 px-3 text-xs leading-9 text-muted-foreground/80 shadow-xs">
        Sample
      </div>
    </div>
  );
}

const slides: Slide[] = [
  {
    id: "home",
    title: "Tap Book a room",
    body: "On Home, use the Book a room shortcut to start.",
    tip: "You can also open Rooms first if you want to browse spaces.",
    icon: DoorOpen,
    preview: (
      <PreviewChrome title="QBook · Home">
        <div className="grid grid-cols-2 gap-2.5">
          {["Book a room", "Calendar", "My bookings", "Rooms"].map(
            (label, index) => (
              <div
                key={label}
                className={cn(
                  "grid min-h-[4.25rem] place-items-center rounded-xl border px-2 text-center text-xs font-semibold transition-colors",
                  index === 0
                    ? "border-primary/50 bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "border-border/70 bg-card text-foreground",
                )}
              >
                {label}
              </div>
            ),
          )}
        </div>
      </PreviewChrome>
    ),
  },
  {
    id: "room",
    title: "Choose a room",
    body: "Pick a room that fits how many people you need and which floor you want.",
    tip: "Busy rooms go quickly. Book early when you can.",
    icon: DoorOpen,
    preview: (
      <PreviewChrome title="Book a room · Pick a room">
        <div className="grid gap-2">
          {[
            { label: "Board Room", meta: "Level 3 · Fits 12" },
            { label: "Meeting Room A", meta: "Level 2 · Fits 6" },
            { label: "Training Hall", meta: "Level 1 · Fits 30" },
          ].map((room, index) => (
            <div
              key={room.label}
              className={cn(
                "rounded-xl border px-3.5 py-2.5",
                index === 0
                  ? "border-primary bg-primary/10 ring-1 ring-primary/25"
                  : "border-border/70 bg-card",
              )}
            >
              <p
                className={cn(
                  "text-xs font-semibold",
                  index === 0 ? "text-primary" : "text-foreground",
                )}
              >
                {room.label}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {room.meta}
              </p>
            </div>
          ))}
        </div>
      </PreviewChrome>
    ),
  },
  {
    id: "schedule",
    title: "Set the date and time",
    body: "Choose the day and start/end time. Open slots are first come, first served.",
    tip: "QBook checks if the room is free before you continue.",
    icon: CalendarDays,
    preview: (
      <PreviewChrome title="Book a room · Date and time">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldStub label="Date" />
          <FieldStub label="Start – End" />
          <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-3 text-center text-[11px] font-medium text-success sm:col-span-2">
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
            Room is free for this time
          </div>
        </div>
      </PreviewChrome>
    ),
  },
  {
    id: "details",
    title: "Add meeting details",
    body: "Enter the purpose, a short description, headcount, and any extras like catering or Teams.",
    tip: "Clear details help admins and attendees know what to expect.",
    icon: FileText,
    preview: (
      <PreviewChrome title="Book a room · Meeting details">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <FieldStub label="Purpose / title" wide />
          <FieldStub label="Description" wide />
          <FieldStub label="How many people?" />
          <FieldStub label="Departments" />
        </div>
      </PreviewChrome>
    ),
  },
  {
    id: "review",
    title: "Review and send",
    body: "Check the summary looks right, then send the booking.",
    tip: "Some rooms need approval. Others confirm right away.",
    icon: ListChecks,
    preview: (
      <PreviewChrome title="Book a room · Review">
        <div className="grid gap-2 text-xs">
          {[
            ["Room", "Board Room, Level 3"],
            ["When", "Tue 10:00 – 11:00"],
            ["Meeting", "Weekly planning"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
          <div className="mt-1.5 rounded-xl bg-primary px-3 py-2.5 text-center text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20">
            Send booking
          </div>
        </div>
      </PreviewChrome>
    ),
  },
  {
    id: "done",
    title: "Follow it in My bookings",
    body: "Open My bookings anytime to view the booking, edit it, or cancel when allowed.",
    tip: "You also get email when the booking is confirmed, changed, or cancelled.",
    icon: CheckCircle2,
    preview: (
      <PreviewChrome title="My bookings">
        <div className="rounded-xl border border-border/70 bg-background/90 px-3.5 py-3.5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold">Weekly planning</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Board Room · Tue 10:00 – 11:00
              </p>
            </div>
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-semibold text-success">
              Confirmed
            </span>
          </div>
        </div>
      </PreviewChrome>
    ),
  },
];

export function BookingFlowSlideshow() {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const slide = slides[index];
  const Icon = slide.icon;
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;

  function goTo(next: number, dir: "next" | "prev") {
    setDirection(dir);
    setIndex((next + slides.length) % slides.length);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setDirection("prev");
        setIndex((current) => (current - 1 + slides.length) % slides.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setDirection("next");
        setIndex((current) => (current + 1) % slides.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-card p-4 shadow-[var(--shadow-card)] sm:p-5"
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            id={labelId}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-primary"
          >
            How to book a room
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Six short steps. Use the arrows or jump to any step below.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 border-2 border-primary/40 bg-card font-semibold shadow-xs hover:border-primary hover:bg-primary/10 sm:size-auto sm:min-h-9 sm:gap-1.5 sm:px-3"
            onClick={() => goTo(index - 1, "prev")}
            aria-label="Previous step"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {isFirst ? "Last" : "Back"}
            </span>
          </Button>
          <Button
            type="button"
            size="icon"
            className="size-9 font-semibold shadow-sm shadow-primary/20 sm:size-auto sm:min-h-9 sm:gap-1.5 sm:px-3"
            onClick={() => goTo(index + 1, "next")}
            aria-label="Next step"
          >
            <span className="hidden sm:inline">
              {isLast ? "Start over" : "Next"}
            </span>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <ol className="mt-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="Walkthrough steps">
        {slides.map((item, itemIndex) => {
          const active = itemIndex === index;
          const done = itemIndex < index;
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${itemIndex + 1}: ${item.title}`}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 text-center transition-[background-color,color,transform] duration-150 ease-out hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]",
                  active && "bg-background/90 shadow-xs",
                )}
                onClick={() =>
                  goTo(itemIndex, itemIndex > index ? "next" : "prev")
                }
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors duration-150",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : done
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {itemIndex + 1}
                </span>
                <span
                  className={cn(
                    "hidden max-w-full truncate text-[10px] font-medium leading-tight sm:block",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-center">
        <div className="min-w-0">
          <div
            key={slide.id}
            className={cn(
              "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300",
              direction === "next"
                ? "motion-safe:slide-in-from-right-2"
                : "motion-safe:slide-in-from-left-2",
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-xl font-semibold tracking-normal text-foreground">
                  {slide.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-foreground/85">
                  {slide.body}
                </p>
                <p className="mt-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm leading-6 text-muted-foreground">
                  {slide.tip}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="min-w-0"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            key={`${slide.id}-preview`}
            className={cn(
              "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300",
              direction === "next"
                ? "motion-safe:slide-in-from-right-3"
                : "motion-safe:slide-in-from-left-3",
            )}
          >
            {slide.preview}
          </div>
        </div>
      </div>
    </div>
  );
}
