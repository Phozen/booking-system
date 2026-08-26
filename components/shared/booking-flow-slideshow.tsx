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
  step: string;
  title: string;
  body: string;
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
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-3 py-2">
        <span className="size-2 rounded-full bg-border" aria-hidden="true" />
        <span className="size-2 rounded-full bg-border" aria-hidden="true" />
        <span className="size-2 rounded-full bg-border" aria-hidden="true" />
        <span className="ml-2 truncate text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

function FieldStub({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <div className={cn("grid gap-1", wide && "sm:col-span-2")}>
      <div className="h-3 w-20 rounded bg-muted-foreground/20" />
      <div className="h-8 rounded-md border border-border/70 bg-card px-2 text-[11px] leading-8 text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

const slides: Slide[] = [
  {
    id: "home",
    step: "1",
    title: "Start from Home",
    body: "Open Book a room from the home shortcuts.",
    icon: DoorOpen,
    preview: (
      <PreviewChrome title="QBook · Home">
        <div className="grid grid-cols-2 gap-2">
          {["Book a room", "Calendar", "My bookings", "Rooms"].map(
            (label, index) => (
              <div
                key={label}
                className={cn(
                  "grid min-h-16 place-items-center rounded-lg border px-2 text-center text-xs font-semibold",
                  index === 0
                    ? "border-primary/40 bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "border-border/60 bg-card text-foreground",
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
    step: "2",
    title: "Pick a room",
    body: "Choose the room that fits your meeting size and floor.",
    icon: DoorOpen,
    preview: (
      <PreviewChrome title="Book a room · Pick a room">
        <div className="grid gap-2">
          {["Board Room · Level 3", "Meeting Room A · Level 2", "Training Hall · Level 1"].map(
            (label, index) => (
              <div
                key={label}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs",
                  index === 0
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border/60 bg-card text-muted-foreground",
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
    id: "schedule",
    step: "3",
    title: "Pick date and time",
    body: "Set the day and time slot. First come, first served.",
    icon: CalendarDays,
    preview: (
      <PreviewChrome title="Book a room · Date and time">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldStub label="Date" />
          <FieldStub label="Start – End" />
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-center text-[11px] text-muted-foreground sm:col-span-2">
            Availability checked before you continue
          </div>
        </div>
      </PreviewChrome>
    ),
  },
  {
    id: "details",
    step: "4",
    title: "Add meeting details",
    body: "Enter the meeting name, description, people count, and extras.",
    icon: FileText,
    preview: (
      <PreviewChrome title="Book a room · Meeting details">
        <div className="grid gap-2 sm:grid-cols-2">
          <FieldStub label="Meeting name" wide />
          <FieldStub label="Description" wide />
          <FieldStub label="How many people?" />
          <FieldStub label="Departments" />
        </div>
      </PreviewChrome>
    ),
  },
  {
    id: "review",
    step: "5",
    title: "Review and send",
    body: "Check the summary, then send the booking request.",
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
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-3 py-2"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
          <div className="mt-1 rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground">
            Send booking
          </div>
        </div>
      </PreviewChrome>
    ),
  },
  {
    id: "done",
    step: "6",
    title: "Track it in My bookings",
    body: "Open My bookings anytime to view, edit, or cancel when allowed.",
    icon: CheckCircle2,
    preview: (
      <PreviewChrome title="My bookings">
        <div className="rounded-lg border border-border/60 bg-card px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold">Weekly planning</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Board Room · Tue 10:00 – 11:00
              </p>
            </div>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
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
  const slide = slides[index];
  const Icon = slide.icon;

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => (current - 1 + slides.length) % slides.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current + 1) % slides.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="rounded-xl border border-border/60 bg-background/70 p-3 sm:p-4"
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            id={labelId}
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Booking walkthrough
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Step {slide.step} of {slides.length}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => goTo(index - 1)}
            aria-label="Previous step"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => goTo(index + 1)}
            aria-label="Next step"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold tracking-normal">
              {slide.title}
            </h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {slide.body}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Walkthrough steps">
            {slides.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={itemIndex === index}
                aria-label={`Go to step ${item.step}: ${item.title}`}
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  itemIndex === index
                    ? "bg-primary"
                    : "bg-border hover:bg-muted-foreground/40",
                )}
                onClick={() => setIndex(itemIndex)}
              />
            ))}
          </div>
        </div>

        <div
          className="min-w-0"
          aria-live="polite"
          aria-atomic="true"
        >
          {slide.preview}
        </div>
      </div>
    </div>
  );
}
