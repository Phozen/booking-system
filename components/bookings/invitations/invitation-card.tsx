import Link from "next/link";
import { ArrowRight, MapPin, UserRound } from "lucide-react";

import {
  formatBookingDate,
  formatBookingWindow,
} from "@/lib/bookings/format";
import type { InvitedBooking } from "@/lib/bookings/invitations/types";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getOrganizerLabel(invitation: InvitedBooking) {
  const organizer = invitation.booking.organizer;

  if (!organizer) {
    return "Organizer unavailable";
  }

  return organizer.fullName?.trim() || organizer.email;
}

export function InvitationCard({
  invitation,
  muted = false,
}: {
  invitation: InvitedBooking;
  muted?: boolean;
}) {
  const booking = invitation.booking;
  const titleId = `invitation-${invitation.invitation.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "grid gap-3 rounded-lg border p-3 shadow-sm sm:p-4",
        muted
          ? "border-slate-300 bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-200"
          : "border-border bg-card",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <BookingStatusBadge status={booking.status} />
          <h3
            id={titleId}
            className="mt-2 break-words text-base font-semibold tracking-normal"
          >
            {booking.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground qbook-type-tabular">
            {formatBookingDate(booking.startsAt)} ·{" "}
            {formatBookingWindow(booking.startsAt, booking.endsAt)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {booking.facility
              ? `${booking.facility.name}, ${booking.facility.level}`
              : "Room unavailable"}
          </p>
        </div>
        <Link
          href={`/bookings/${booking.id}`}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "w-full bg-background/80 sm:w-fit",
          })}
        >
          View details
          <ArrowRight data-icon="inline-end" />
        </Link>
      </div>

      <dl className="grid min-w-0 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <div className="inline-flex min-w-0 items-center gap-2">
          <dt className="sr-only">Organizer</dt>
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          <dd className="min-w-0 break-words">{getOrganizerLabel(invitation)}</dd>
        </div>
        <div className="inline-flex min-w-0 items-center gap-2">
          <dt className="sr-only">Room</dt>
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <dd className="min-w-0 break-words">
            {booking.facility?.name ?? "Room unavailable"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
