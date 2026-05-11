import { formatBookingDateTime } from "@/lib/bookings/format";
import type {
  BookingInvitation,
  InviteCandidate,
} from "@/lib/bookings/invitations/types";
import { InviteUserForm } from "@/components/bookings/invitations/invite-user-form";
import { RemoveInvitationButton } from "@/components/bookings/invitations/remove-invitation-button";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";

function getProfileLabel(profile: { fullName: string | null; email: string } | null) {
  if (!profile) {
    return "Unknown user";
  }

  return profile.fullName?.trim() || profile.email;
}

export function InvitationList({
  bookingId,
  invitations,
  candidates = [],
  canManage,
}: {
  bookingId: string;
  invitations: BookingInvitation[];
  candidates?: InviteCandidate[];
  canManage?: boolean;
}) {
  return (
    <section className="grid gap-4 rounded-lg border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          Invited attendees
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {canManage
            ? "Invite active internal users to this booking and track their response."
            : "Review attendee invitations and response status for this booking."}
        </p>
      </div>

      {canManage ? (
        <InviteUserForm bookingId={bookingId} candidates={candidates} />
      ) : null}

      {invitations.length > 0 ? (
        <div className="grid gap-3">
          {invitations.map((invitation) => {
            const inviteeLabel = getProfileLabel(invitation.invitedUser);

            return (
              <article
                key={invitation.id}
                className="grid gap-4 rounded-lg border border-border/70 bg-background p-4 shadow-sm ring-1 ring-primary/5 sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge kind="invitation" status={invitation.status} />
                    <span className="text-xs text-muted-foreground">
                      Invited {formatBookingDateTime(invitation.createdAt)}
                    </span>
                  </div>
                  <h3 className="mt-2 break-words font-semibold tracking-normal">
                    {inviteeLabel}
                  </h3>
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {invitation.invitedUser?.email ?? "Email unavailable"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {invitation.respondedAt
                      ? `Responded ${formatBookingDateTime(invitation.respondedAt)}`
                      : "No response yet"}
                  </p>
                </div>
                {canManage ? (
                  <RemoveInvitationButton
                    invitationId={invitation.id}
                    inviteeLabel={inviteeLabel}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No invited attendees yet"
          description={
            canManage
              ? "Invite an active internal user when someone else should attend this booking."
              : "This booking has no invited attendees."
          }
        />
      )}
    </section>
  );
}
