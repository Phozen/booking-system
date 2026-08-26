import type { InvitedBooking } from "@/lib/bookings/invitations/types";
import { CompactInvitationSection } from "@/components/bookings/invitations/compact-invitation-section";
import { InvitationCard } from "@/components/bookings/invitations/invitation-card";
import { EmptyState } from "@/components/shared/empty-state";

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

function isUpcomingInvitation(invitation: InvitedBooking, now: Date) {
  if (invitation.invitation.status === "removed") {
    return false;
  }

  if (
    invitation.booking.status === "cancelled" ||
    invitation.booking.status === "rejected" ||
    invitation.booking.status === "completed"
  ) {
    return false;
  }

  return new Date(invitation.booking.startsAt).getTime() >= now.getTime();
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
    invitations.length === 1 ? "1 booking" : `${invitations.length} bookings`;

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
  now = new Date(),
}: {
  invitations: InvitedBooking[];
  now?: Date;
}) {
  const active = invitations.filter(
    (invitation) => invitation.invitation.status !== "removed",
  );
  const upcoming = sortByMeetingTime(
    active.filter((invitation) => isUpcomingInvitation(invitation, now)),
    "asc",
  );
  const past = sortByMeetingTime(
    active.filter((invitation) => !isUpcomingInvitation(invitation, now)),
    "desc",
  );

  if (active.length === 0) {
    return (
      <EmptyState
        title="No invited bookings yet"
        description="When someone adds you to a meeting, it will show up here."
      />
    );
  }

  return (
    <div className="grid gap-8">
      <InvitationSection
        sectionId="upcoming"
        title="Upcoming"
        invitations={upcoming}
      />
      {past.length > 0 ? (
        <CompactInvitationSection
          sectionId="past"
          title="Past"
          invitations={past}
          muted
          compact
        />
      ) : null}
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No upcoming invited bookings.
        </p>
      ) : null}
    </div>
  );
}
