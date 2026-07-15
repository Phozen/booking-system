"use client";

import { useMemo, useState } from "react";

import { formatBookingDateTime } from "@/lib/bookings/format";
import type {
  BookingInvitation,
  BookingInvitationStatus,
} from "@/lib/bookings/invitations/types";
import { cn } from "@/lib/utils";
import { InviteUserForm } from "@/components/bookings/invitations/invite-user-form";
import { RemoveInvitationButton } from "@/components/bookings/invitations/remove-invitation-button";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const PAGE_SIZE = 25;

function getProfileLabel(profile: { fullName: string | null; email: string } | null) {
  if (!profile) {
    return "Unknown user";
  }

  return profile.fullName?.trim() || profile.email;
}

export function InvitationList({
  bookingId,
  invitations,
  canManage,
  highlight,
}: {
  bookingId: string;
  invitations: BookingInvitation[];
  canManage?: boolean;
  highlight?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | BookingInvitationStatus>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const normalizedSearch = search.trim().toLowerCase();
  const counts = useMemo(
    () => ({
      pending: invitations.filter((invitation) => invitation.status === "pending").length,
      accepted: invitations.filter((invitation) => invitation.status === "accepted").length,
      declined: invitations.filter((invitation) => invitation.status === "declined").length,
    }),
    [invitations],
  );
  const filteredInvitations = useMemo(
    () =>
      invitations.filter((invitation) => {
        if (status !== "all" && invitation.status !== status) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const label = getProfileLabel(invitation.invitedUser).toLowerCase();
        const email = invitation.invitedUser?.email.toLowerCase() ?? "";
        return label.includes(normalizedSearch) || email.includes(normalizedSearch);
      }),
    [invitations, normalizedSearch, status],
  );
  const visibleInvitations = filteredInvitations.slice(0, visibleCount);

  return (
    <section
      id="invite-attendees"
      className={cn(
        "scroll-mt-24 grid gap-5 rounded-lg border bg-card p-5",
        highlight &&
          "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10 ring-2 ring-primary/25",
      )}
    >
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          {highlight ? "Invite attendees to this meeting?" : "Invited attendees"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {canManage
            ? "Search the staff directory, invite several people together, and track their responses."
            : "Review attendee invitations and response status for this booking."}
        </p>
      </div>

      {canManage ? <InviteUserForm bookingId={bookingId} /> : null}

      {invitations.length > 0 ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full border border-border/75 bg-background px-3 py-1">
              {invitations.length} total
            </span>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              {counts.pending} pending
            </span>
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
              {counts.accepted} accepted
            </span>
            <span className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
              {counts.declined} declined
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="grid gap-2">
              <Label htmlFor="invitation-search">Search attendees</Label>
              <Input
                id="invitation-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Name or email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invitation-status">Response status</Label>
              <Select
                id="invitation-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as "all" | BookingInvitationStatus);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </Select>
            </div>
          </div>

          {visibleInvitations.length > 0 ? (
            <div className="grid gap-2">
              {visibleInvitations.map((invitation) => {
                const inviteeLabel = getProfileLabel(invitation.invitedUser);

                return (
                  <article
                    key={invitation.id}
                    className="grid gap-3 rounded-lg border border-border/70 bg-background px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold tracking-normal">
                          {inviteeLabel}
                        </h3>
                        <StatusBadge kind="invitation" status={invitation.status} />
                      </div>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {invitation.invitedUser?.email ?? "Email unavailable"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {invitation.respondedAt
                          ? `Responded ${formatBookingDateTime(invitation.respondedAt)}`
                          : `Invited ${formatBookingDateTime(invitation.createdAt)}`}
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
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No invited attendees match these filters.
            </p>
          )}

          {filteredInvitations.length > visibleCount ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, filteredInvitations.length - visibleCount)} more
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No invited attendees yet"
          description={
            canManage
              ? "Search for active internal staff when someone else should attend this booking."
              : "This booking has no invited attendees."
          }
        />
      )}
    </section>
  );
}
