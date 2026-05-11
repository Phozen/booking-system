import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, UserRound } from "lucide-react";

import {
  formatBookingDate,
  formatBookingWindow,
} from "@/lib/bookings/format";
import type { BookingInvitationStatus, InvitedBooking } from "@/lib/bookings/invitations/types";
import { InvitationResponseActions } from "@/components/bookings/invitations/invitation-response-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

function getOrganizerLabel(invitation: InvitedBooking) {
  const organizer = invitation.booking.organizer;

  if (!organizer) {
    return "Organizer unavailable";
  }

  return organizer.fullName?.trim() || organizer.email;
}

function InvitationCard({ invitation }: { invitation: InvitedBooking }) {
  const booking = invitation.booking;

  return (
    <article className="grid gap-4 rounded-lg border border-border/70 bg-card p-4 shadow-sm ring-1 ring-primary/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge kind="invitation" status={invitation.invitation.status} />
          <h3 className="mt-2 break-words text-base font-semibold tracking-normal">
            {booking.title}
          </h3>
        </div>
        <Link
          href={`/bookings/${booking.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          View details
          <ArrowRight data-icon="inline-end" />
        </Link>
      </div>

      <dl className="grid min-w-0 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <div className="inline-flex min-w-0 items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">
            {booking.facility
              ? `${booking.facility.name}, ${booking.facility.level}`
              : "Facility unavailable"}
          </span>
        </div>
        <div className="inline-flex min-w-0 items-center gap-2">
          <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">
            {formatBookingDate(booking.startsAt)},{" "}
            {formatBookingWindow(booking.startsAt, booking.endsAt)}
          </span>
        </div>
        <div className="inline-flex min-w-0 items-center gap-2">
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">
            Organized by {getOrganizerLabel(invitation)}
          </span>
        </div>
        <div>
          <StatusBadge kind="booking" status={booking.status} />
        </div>
      </dl>

      {invitation.invitation.status === "pending" ? (
        <InvitationResponseActions invitationId={invitation.invitation.id} />
      ) : null}
    </article>
  );
}

function InvitationSection({
  title,
  invitations,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  invitations: InvitedBooking[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {invitations.length}
        </span>
      </div>
      {invitations.length > 0 ? (
        <div className="grid gap-3">
          {invitations.map((invitation) => (
            <InvitationCard
              key={invitation.invitation.id}
              invitation={invitation}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="items-start p-4 text-left"
          title={emptyTitle}
          description={emptyDescription}
        />
      )}
    </section>
  );
}

export function InvitationsPageList({
  invitations,
}: {
  invitations: InvitedBooking[];
}) {
  const byStatus = invitations.reduce<
    Record<Exclude<BookingInvitationStatus, "removed">, InvitedBooking[]>
  >(
    (groups, invitation) => {
      if (invitation.invitation.status !== "removed") {
        groups[invitation.invitation.status].push(invitation);
      }

      return groups;
    },
    { pending: [], accepted: [], declined: [] },
  );
  const hasAnyInvitations = invitations.length > 0;

  return (
    <div className="grid gap-8">
      {!hasAnyInvitations ? (
        <EmptyState
          title="No invitations yet"
          description="Bookings you are invited to will appear here with accept and decline actions."
          action={
            <Link href="/calendar" className={buttonVariants({ variant: "outline" })}>
              View calendar
            </Link>
          }
        />
      ) : null}

      <InvitationSection
        title="Pending invitations"
        invitations={byStatus.pending}
        emptyTitle="No pending invitations."
        emptyDescription="New booking invitations that need your response will appear here."
      />
      <InvitationSection
        title="Accepted invitations"
        invitations={byStatus.accepted}
        emptyTitle="No accepted invitations."
        emptyDescription="Accepted invited bookings will appear here."
      />
      <InvitationSection
        title="Declined invitations"
        invitations={byStatus.declined}
        emptyTitle="No declined invitations."
        emptyDescription="Declined invitations remain here for reference."
      />
    </div>
  );
}
