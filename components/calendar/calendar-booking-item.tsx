"use client";

import Link from "next/link";
import { useId, useRef } from "react";
import { ArrowRight, CalendarClock, MapPin, UserRound, X } from "lucide-react";

import { formatBookingDate, formatBookingWindow } from "@/lib/bookings/format";
import type { CalendarBooking } from "@/lib/calendar/group-bookings";
import { StatusBadge } from "@/components/shared/status-badge";
import { centeredDialogClassName } from "@/components/shared/dialog-styles";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarBookingItem({
  booking,
  compact,
}: {
  booking: CalendarBooking;
  compact?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  function closeDialog() {
    dialogRef.current?.close();
    triggerRef.current?.focus();
  }

  const detailRows = (
    <dl className="grid gap-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Purpose</dt>
        <dd className="font-medium">{booking.title}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Status</dt>
        <dd className="mt-1">
          <StatusBadge kind="booking" status={booking.status} />
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Time</dt>
        <dd>{formatBookingWindow(booking.startsAt, booking.endsAt)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Location</dt>
        <dd>
          {booking.facilityName}, {booking.facilityLevel}
          {booking.facilityType ? ` - ${booking.facilityType}` : ""}
        </dd>
      </div>
      {booking.userLabel ? (
        <div>
          <dt className="text-muted-foreground">Requester</dt>
          <dd>{booking.userLabel}</dd>
        </div>
      ) : null}
    </dl>
  );

  if (compact) {
    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="pointer-events-auto group relative z-10 w-full truncate rounded-md border border-border/70 bg-card px-2 py-1 text-left text-xs font-medium shadow-sm transition-colors hover:border-primary/45 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {booking.title}
        </button>
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          className={`${centeredDialogClassName} pointer-events-auto`}
        >
          <div className="grid gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-lg font-semibold tracking-normal">
                Booking details
              </h2>
              <Button type="button" variant="ghost" size="icon" onClick={closeDialog}>
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            {detailRows}
            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Close
              </Button>
              {booking.href ? (
                <Link href={booking.href} className={buttonVariants()}>
                  Open booking
                  <ArrowRight data-icon="inline-end" />
                </Link>
              ) : null}
            </div>
          </div>
        </dialog>
      </>
    );
  }

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 break-words font-medium leading-5 text-foreground">
          {booking.title}
        </span>
        <StatusBadge kind="booking" status={booking.status} />
      </div>

      <dl className="grid min-w-0 gap-1 break-words text-muted-foreground">
        {!compact ? (
          <div className="inline-flex items-center gap-2">
            <CalendarClock className="size-4" aria-hidden="true" />
            <span>
              {formatBookingDate(booking.startsAt)},{" "}
              {formatBookingWindow(booking.startsAt, booking.endsAt)}
            </span>
          </div>
        ) : (
          <div>{formatBookingWindow(booking.startsAt, booking.endsAt)}</div>
        )}
        <div className="inline-flex items-center gap-2">
          <MapPin
            className={cn("size-4", compact ? "hidden" : "")}
            aria-hidden="true"
          />
          <span>
            {booking.facilityName}, {booking.facilityLevel}
            {booking.facilityType ? ` - ${booking.facilityType}` : ""}
          </span>
        </div>
        {booking.userLabel ? (
          <div className="inline-flex items-center gap-2">
            <UserRound
              className={cn("size-4", compact ? "hidden" : "")}
              aria-hidden="true"
            />
            <span>{booking.userLabel}</span>
          </div>
        ) : null}
        {booking.contextLabel ? (
          <div className="font-medium text-primary">{booking.contextLabel}</div>
        ) : null}
        {typeof booking.approvalRequired === "boolean" ? (
          <div>
            Approval {booking.approvalRequired ? "required" : "not required"}
          </div>
        ) : null}
      </dl>

      {!compact ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          {booking.href ? "View details" : "Limited calendar item"}
          {booking.href ? (
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          ) : null}
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "group grid gap-2 rounded-lg border border-border/70 bg-card p-3 text-sm shadow-sm shadow-primary/5 ring-1 ring-primary/10 transition-all",
    booking.href
      ? "hover:border-primary/40 hover:bg-accent/55 hover:shadow-md hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
      : "cursor-default",
    compact ? "p-2 text-xs" : "",
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={cn(className, "text-left")}
        aria-label={`${booking.title} calendar item`}
      >
        {content}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className={`${centeredDialogClassName} pointer-events-auto`}
      >
        <div className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-semibold tracking-normal">
              Booking details
            </h2>
            <Button type="button" variant="ghost" size="icon" onClick={closeDialog}>
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          {detailRows}
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Close
            </Button>
            {booking.href ? (
              <Link href={booking.href} className={buttonVariants()}>
                Open booking
                <ArrowRight data-icon="inline-end" />
              </Link>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
