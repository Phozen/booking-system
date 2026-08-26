import Link from "next/link";
import { CalendarPlus, CheckCircle2, UserPlus } from "lucide-react";

import type { GroupedEmployeeBookings } from "@/lib/bookings/grouping";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { BookingCard } from "@/components/bookings/booking-card";
import { CompactBookingSection } from "@/components/bookings/compact-booking-section";
import { HighlightScrollEffect } from "@/components/bookings/highlight-scroll-effect";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { INTERNAL_INVITES_ENABLED } from "@/lib/bookings/invitations/feature";

function formatInvitationSummary({
  pending,
  accepted,
}: {
  pending: number;
  accepted: number;
}) {
  const parts: string[] = [];

  if (pending > 0) {
    parts.push(
      `${pending} pending invitation${pending === 1 ? "" : "s"}`,
    );
  }

  if (accepted > 0) {
    parts.push(
      `${accepted} accepted invitation${accepted === 1 ? "" : "s"}`,
    );
  }

  if (parts.length === 0) {
    return null;
  }

  if (parts.length === 1) {
    return `You have ${parts[0]}.`;
  }

  return `You have ${parts[0]} and ${parts[1]}.`;
}

function BookingSection({
  sectionId,
  title,
  bookings,
  emptyMessage,
  emptyDescription,
  muted = false,
  highlightId,
}: {
  sectionId: string;
  title: string;
  bookings: EmployeeBooking[];
  emptyMessage: string;
  emptyDescription?: string;
  muted?: boolean;
  highlightId?: string;
}) {
  const headingId = `${sectionId}-heading`;
  const countLabel =
    bookings.length === 1 ? "1 booking" : `${bookings.length} bookings`;

  return (
    <section className="grid gap-3" aria-labelledby={headingId}>
      <div className="flex items-center justify-between border-b-2 border-border pb-2">
        <h2
          id={headingId}
          className="text-base font-semibold tracking-normal"
        >
          {title}
        </h2>
        <span
          className="rounded-full border border-border/70 bg-muted px-2 py-0.5 text-sm font-medium tabular-nums text-muted-foreground"
          aria-label={countLabel}
        >
          {bookings.length}
        </span>
      </div>

      {bookings.length > 0 ? (
        <div className="qbook-stagger grid gap-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              muted={muted}
              highlighted={highlightId === booking.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="items-start p-4 text-left"
          title={emptyMessage}
          description={emptyDescription}
          titleAs="h3"
        />
      )}
    </section>
  );
}

export function MyBookingsList({
  groupedBookings,
  created,
  highlightId,
  invitationSummary,
}: {
  groupedBookings: GroupedEmployeeBookings;
  created?: boolean;
  highlightId?: string;
  invitationSummary?: { pending: number; accepted: number; total: number };
}) {
  const hasAnyBookings = Object.values(groupedBookings).some(
    (bookings) => bookings.length > 0,
  );
  const invitationSummaryText =
    invitationSummary && invitationSummary.total > 0
      ? formatInvitationSummary(invitationSummary)
      : null;

  return (
    <div className="grid gap-8">
      <HighlightScrollEffect highlight={highlightId} />

      {created ? (
        <Alert variant="success">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Room booking saved</AlertTitle>
          <AlertDescription>
            {highlightId
              ? "Your booking is highlighted below. Open it to review details, invite attendees, or make changes."
              : "Your booking is in the list below. Open it to review details or invite attendees."}
          </AlertDescription>
        </Alert>
      ) : null}

      {INTERNAL_INVITES_ENABLED && invitationSummaryText ? (
        <section
          className="grid gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-950 shadow-sm ring-1 ring-sky-200/60 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"
          aria-labelledby="my-bookings-invitations-heading"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2
                id="my-bookings-invitations-heading"
                className="inline-flex items-center gap-2 font-semibold tracking-normal"
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Room invitations
              </h2>
              <p className="mt-1 text-sm text-sky-800 dark:text-sky-200">
                {invitationSummaryText}
              </p>
            </div>
            <Link
              href="/invitations"
              className={buttonVariants({
                variant: "outline",
                className:
                  "w-full border-sky-300 bg-card text-foreground hover:bg-sky-100 sm:w-auto dark:border-sky-800 dark:hover:bg-sky-950/60",
              })}
            >
              Review invitations
            </Link>
          </div>
        </section>
      ) : null}

      {!hasAnyBookings ? (
        <EmptyState
          title="No room bookings yet"
          description="Browse facilities to compare rooms, or book directly if you already know the time slot."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/facilities"
                className={buttonVariants({ variant: "outline" })}
              >
                Find a room
              </Link>
              <Link
                href="/bookings/new"
                className={buttonVariants({ variant: "ghost" })}
              >
                <CalendarPlus data-icon="inline-start" />
                Book a room
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <BookingSection
            sectionId="pending-approval"
            title="Pending approval"
            bookings={groupedBookings.pending}
            emptyMessage="No requests waiting for approval."
            highlightId={highlightId}
          />
          <BookingSection
            sectionId="upcoming-confirmed"
            title="Upcoming confirmed"
            bookings={groupedBookings.upcoming}
            emptyMessage="No confirmed room bookings coming up."
            emptyDescription="Once a booking is confirmed, its room and time slot will appear here."
            highlightId={highlightId}
          />
          <CompactBookingSection
            sectionId="history"
            title="History"
            bookings={groupedBookings.history}
            emptyMessage="No previous bookings yet."
            emptyDescription="Completed, expired, and rejected room requests will appear here for reference."
            muted
            highlightId={highlightId}
            compact
          />
          <CompactBookingSection
            sectionId="cancelled"
            title="Cancelled"
            bookings={groupedBookings.cancelled}
            emptyMessage="No cancelled room bookings."
            highlightId={highlightId}
            compact
          />
        </>
      )}
    </div>
  );
}
