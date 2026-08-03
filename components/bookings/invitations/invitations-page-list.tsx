import Link from "next/link";

import type { BookingInvitationStatus, InvitedBooking } from "@/lib/bookings/invitations/types";
import { CompactInvitationSection } from "@/components/bookings/invitations/compact-invitation-section";
import { InvitationCard } from "@/components/bookings/invitations/invitation-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

function sortByMeetingTime(
  invitations: InvitedBooking[],
  order: "asc" | "desc",
) {
  return [...invitations].sort((left, right) => {
    const leftTime = new Date(left.booking.startsAt).getTime();
    const rightTime = new Date(right.booking.startsAt).getTime();

    return order === "asc" ? leftTime - rightTime : rightTime - leftTime;
  });
}

function InvitationSection({
  sectionId,
  title,
  invitations,
}: {
  sectionId: string;
  title: string;
  invitations: InvitedBooking[];
}) {
  if (invitations.length === 0) {
    return null;
  }

  const headingId = `${sectionId}-heading`;
  const countLabel =
    invitations.length === 1 ? "1 invite" : `${invitations.length} invites`;

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
          {invitations.length}
        </span>
      </div>

      <div className="grid gap-3">
        {invitations.map((invitation) => (
          <InvitationCard key={invitation.invitation.id} invitation={invitation} />
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
  const pending = sortByMeetingTime(byStatus.pending, "asc");
  const accepted = sortByMeetingTime(byStatus.accepted, "desc");
  const declined = sortByMeetingTime(byStatus.declined, "desc");

  if (!hasAnyInvitations) {
    return (
      <EmptyState
        title="No invites yet"
        description="When someone invites you to a meeting, it will show up here."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/calendar" className={buttonVariants({ variant: "outline" })}>
              View calendar
            </Link>
            <Link href="/my-bookings" className={buttonVariants({ variant: "ghost" })}>
              My bookings
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="grid gap-8">
      <InvitationSection
        sectionId="pending"
        title="Pending"
        invitations={pending}
      />
      {accepted.length > 0 ? (
        <CompactInvitationSection
          sectionId="accepted"
          title="Accepted"
          invitations={accepted}
          muted
          compact
        />
      ) : null}
      {declined.length > 0 ? (
        <CompactInvitationSection
          sectionId="declined"
          title="Declined"
          invitations={declined}
          muted
          compact
        />
      ) : null}
    </div>
  );
}
