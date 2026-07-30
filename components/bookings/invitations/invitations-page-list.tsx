import Link from "next/link";
import { ArrowRight, MapPin, UserRound } from "lucide-react";

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
  const isPending = invitation.invitation.status === "pending";

  return (
    <article className="grid gap-4 border-b border-border py-5 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge kind="invitation" status={invitation.invitation.status} />
          <h3 className="qbook-type-section mt-2 break-words text-base">
            {booking.title}
          </h3>
          <p className="qbook-type-meta mt-1 qbook-type-tabular">
            {formatBookingDate(booking.startsAt)} ·{" "}
            {formatBookingWindow(booking.startsAt, booking.endsAt)}
          </p>
          <p className="qbook-type-meta mt-1">
            {booking.facility
              ? `${booking.facility.name}, ${booking.facility.level}`
              : "Room unavailable"}
          </p>
        </div>
        {!isPending ? (
          <Link
            href={`/bookings/${booking.id}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View details
            <ArrowRight data-icon="inline-end" />
          </Link>
        ) : null}
      </div>

      <dl className="grid min-w-0 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <div className="inline-flex min-w-0 items-center gap-2">
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">
            Organized by {getOrganizerLabel(invitation)}
          </span>
        </div>
        <div className="inline-flex min-w-0 items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">
            Room status: {booking.status.replaceAll("_", " ")}
          </span>
        </div>
      </dl>

      {isPending ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <InvitationResponseActions invitationId={invitation.invitation.id} />
          <Link
            href={`/bookings/${booking.id}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View details
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function InvitationSection({
  title,
  invitations,
}: {
  title: string;
  invitations: InvitedBooking[];
}) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-1">
      <div className="flex items-center justify-between pb-2">
        <h2 className="qbook-type-section">{title}</h2>
        <span className="qbook-type-meta qbook-type-tabular">
          {invitations.length}
        </span>
      </div>
      <div className="grid">
        {invitations.map((invitation) => (
          <InvitationCard
            key={invitation.invitation.id}
            invitation={invitation}
          />
        ))}
      </div>
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
  const hasAnyInvitations = invitations.some(
    (invitation) => invitation.invitation.status !== "removed",
  );

  if (!hasAnyInvitations) {
    return (
      <EmptyState
        title="No invites yet"
        description="When someone invites you to a meeting, it will show up here."
        action={
          <Link href="/calendar" className={buttonVariants({ variant: "outline" })}>
            View calendar
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8">
      <InvitationSection
        title="Pending"
        invitations={byStatus.pending}
      />
      <InvitationSection
        title="Accepted"
        invitations={byStatus.accepted}
      />
      <InvitationSection
        title="Declined"
        invitations={byStatus.declined}
      />
    </div>
  );
}
