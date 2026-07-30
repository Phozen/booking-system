"use client";

import Link from "next/link";
import { useId, useRef } from "react";
import { ArrowRight, CalendarClock, MapPin, UserRound, X } from "lucide-react";

import { formatBookingDate, formatBookingWindow } from "@/lib/bookings/format";
import type { CalendarBooking } from "@/lib/calendar/group-bookings";
import {
  getBookingRelationshipBadgeClassName,
  getBookingRelationshipSurfaceClassName,
  getBookingRelationshipToken,
} from "@/components/shared/booking-relationship-tokens";
import { StatusBadge } from "@/components/shared/status-badge";
import { centeredDialogClassName } from "@/components/shared/dialog-styles";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function RelationshipBadge({
  booking,
}: {
  booking: CalendarBooking;
}) {
  if (!booking.contextLabel && !booking.relationship) {
    return null;
  }

  const label =
    booking.contextLabel ??
    (booking.relationship
      ? getBookingRelationshipToken(booking.relationship).label
      : null);

  if (!label) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
        booking.relationship
          ? getBookingRelationshipBadgeClassName(booking.relationship)
          : "border-primary/25 bg-primary/10 text-primary",
      )}
    >
      {label}
    </span>
  );
}

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

  const relationshipLabel = booking.relationship
    ? getBookingRelationshipToken(booking.relationship).shortLabel
    : undefined;

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
      {booking.contextLabel || booking.relationship ? (
        <div>
          <dt className="text-muted-foreground">Relationship</dt>
          <dd className="mt-1">
            <RelationshipBadge booking={booking} />
          </dd>
        </div>
      ) : null}
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
          className={cn(
            "pointer-events-auto group relative z-10 w-full truncate rounded-md border px-2 py-1 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            booking.relationship
              ? getBookingRelationshipSurfaceClassName(booking.relationship)
              : "border-border/70 bg-card shadow-sm hover:border-primary/45 hover:bg-accent/60",
          )}
          aria-label={
            relationshipLabel
              ? `${booking.title}, ${relationshipLabel}`
              : booking.title
          }
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

      {booking.contextLabel || booking.relationship ? (
        <div>
          <RelationshipBadge booking={booking} />
        </div>
      ) : null}

      <dl className="grid min-w-0 gap-1 break-words text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <CalendarClock className="size-4" aria-hidden="true" />
          <span>
            {formatBookingDate(booking.startsAt)},{" "}
            {formatBookingWindow(booking.startsAt, booking.endsAt)}
          </span>
        </div>
        <div className="inline-flex items-center gap-2">
          <MapPin className="size-4" aria-hidden="true" />
          <span>
            {booking.facilityName}, {booking.facilityLevel}
            {booking.facilityType ? ` - ${booking.facilityType}` : ""}
          </span>
        </div>
        {booking.userLabel ? (
          <div className="inline-flex items-center gap-2">
            <UserRound className="size-4" aria-hidden="true" />
            <span>{booking.userLabel}</span>
          </div>
        ) : null}
      </dl>

      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
        {booking.href ? "View details" : "Limited calendar item"}
        {booking.href ? (
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        ) : null}
      </span>
    </>
  );

  const className = cn(
    "group grid gap-2 rounded-lg border border-border/70 bg-card p-3 text-sm transition-colors",
    booking.href
      ? "hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      : "cursor-default",
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={cn(className, "text-left")}
        aria-label={
          relationshipLabel
            ? `${booking.title}, ${relationshipLabel}`
            : `${booking.title} calendar item`
        }
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
