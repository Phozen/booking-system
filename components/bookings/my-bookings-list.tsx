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
}: {
  title: string;
  bookings: EmployeeBooking[];
  emptyMessage: string;
  emptyDescription: string;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        <span className="text-sm text-muted-foreground">{bookings.length}</span>
      </div>

      {bookings.length > 0 ? (
        <div className="grid gap-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
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
          <AlertTitle>Booking saved</AlertTitle>
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
                Invited meetings
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
              View invitations
            </Link>
          </div>
        </section>
      ) : null}

      {!hasAnyBookings ? (
        <EmptyState
          title="No bookings yet"
          description="Create your first booking from the facilities list or start directly from the booking form."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/facilities" className={buttonVariants()}>
                Browse facilities
              </Link>
              <Link
                href="/bookings/new"
                className={buttonVariants({ variant: "outline" })}
              >
                <CalendarPlus data-icon="inline-start" />
                Create your first booking
              </Link>
            </div>
          }
        />
      ) : null}

      <BookingSection
        title="Pending approval"
        bookings={groupedBookings.pending}
        emptyMessage="No pending bookings."
        emptyDescription="Requests that need admin approval will appear here."
      />
      <BookingSection
        title="Upcoming confirmed"
        bookings={groupedBookings.upcoming}
        emptyMessage="No upcoming confirmed bookings."
        emptyDescription="Confirmed future bookings will appear here."
      />
      <BookingSection
        title="History"
        bookings={groupedBookings.history}
        emptyMessage="No booking history yet."
        emptyDescription="Completed, expired, or rejected bookings will appear here."
      />
      <BookingSection
        title="Cancelled"
        bookings={groupedBookings.cancelled}
        emptyMessage="No cancelled bookings."
        emptyDescription="Bookings you cancel will remain visible here for reference."
      />
    </div>
  );
}
