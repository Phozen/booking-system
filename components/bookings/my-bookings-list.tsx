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
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

function BookingSection({
  title,
  bookings,
  emptyMessage,
  emptyDescription,
  muted = false,
}: {
  title: string;
  bookings: EmployeeBooking[];
  emptyMessage: string;
  emptyDescription: string;
  muted?: boolean;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between border-b border-border/70 pb-2">
        <h2 className="text-base font-semibold tracking-normal">{title}</h2>
        <span className="rounded-full border border-border/70 bg-muted px-2 py-0.5 text-sm font-medium text-muted-foreground">
          {bookings.length}
        </span>
      </div>

      {bookings.length > 0 ? (
        <div className="grid gap-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} muted={muted} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="items-start p-4 text-left"
          title={emptyMessage}
          description={emptyDescription}
        />
      )}
    </section>
  );
}

export function MyBookingsList({
  groupedBookings,
  created,
  invitationSummary,
}: {
  groupedBookings: GroupedEmployeeBookings;
  created?: boolean;
  invitationSummary?: { pending: number; accepted: number; total: number };
}) {
  const hasAnyBookings = Object.values(groupedBookings).some(
    (bookings) => bookings.length > 0,
  );

  return (
    <div className="grid gap-8">
      {created ? (
        <Alert variant="success">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Room booking saved</AlertTitle>
          <AlertDescription>
            Your booking is now in My Bookings. Confirmed bookings are ready to
            use; pending requests are waiting for admin approval.
          </AlertDescription>
        </Alert>
      ) : null}

      {invitationSummary && invitationSummary.total > 0 ? (
        <section className="grid gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-950 shadow-sm ring-1 ring-sky-200/60 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="inline-flex items-center gap-2 font-semibold tracking-normal">
                <UserPlus className="size-4" aria-hidden="true" />
                Room invitations
              </h2>
              <p className="mt-1 text-sm text-sky-800 dark:text-sky-200">
                You have {invitationSummary.pending} pending and{" "}
                {invitationSummary.accepted} accepted invitation
                {invitationSummary.total === 1 ? "" : "s"}.
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
          description="Start from the room list if you need to compare capacity or equipment. Use the booking form if you already know the time slot."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/facilities" className={buttonVariants()}>
                Find a room
              </Link>
              <Link
                href="/bookings/new"
                className={buttonVariants({ variant: "outline" })}
              >
                <CalendarPlus data-icon="inline-start" />
                Book a room
              </Link>
            </div>
          }
        />
      ) : null}

      <BookingSection
        title="Pending approval"
        bookings={groupedBookings.pending}
        emptyMessage="No requests waiting for approval."
        emptyDescription="Approval-required room bookings will appear here until an admin confirms or rejects them."
      />
      <BookingSection
        title="Upcoming confirmed"
        bookings={groupedBookings.upcoming}
        emptyMessage="No confirmed room bookings coming up."
        emptyDescription="Once a booking is confirmed, its room and time slot will appear here."
      />
      <BookingSection
        title="History"
        bookings={groupedBookings.history}
        emptyMessage="No previous bookings yet."
        emptyDescription="Completed, expired, and rejected room requests will appear here for reference."
        muted
      />
      <BookingSection
        title="Cancelled"
        bookings={groupedBookings.cancelled}
        emptyMessage="No cancelled room bookings."
        emptyDescription="Cancelled bookings stay here so you can verify what was released."
      />
    </div>
  );
}
