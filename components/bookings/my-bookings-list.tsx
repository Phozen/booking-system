import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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
}: {
  groupedBookings: GroupedEmployeeBookings;
  created?: boolean;
  highlightId?: string;
}) {
  const hasAnyBookings = Object.values(groupedBookings).some(
    (bookings) => bookings.length > 0,
  );

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

      {!hasAnyBookings ? (
        <EmptyState
          title="No room bookings yet"
          description="Browse facilities to compare rooms, or book directly if you already know the time slot."
          action={
            <Link
              href="/facilities"
              className={buttonVariants({ variant: "outline" })}
            >
              Find a room
            </Link>
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
