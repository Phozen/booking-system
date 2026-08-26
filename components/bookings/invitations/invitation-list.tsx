"use client";

import { useMemo, useState } from "react";

import { formatBookingDateTime } from "@/lib/bookings/format";
import type {
  BookingInvitation,
} from "@/lib/bookings/invitations/types";
import type { Department } from "@/lib/departments/queries";
import { INTERNAL_INVITES_ENABLED } from "@/lib/bookings/invitations/feature";
import { cn } from "@/lib/utils";
import { BookingDepartmentManager } from "@/components/bookings/booking-department-manager";
import { InviteUserForm } from "@/components/bookings/invitations/invite-user-form";
import { RemoveInvitationButton } from "@/components/bookings/invitations/remove-invitation-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  departments = [],
  selectedDepartmentIds = [],
}: {
  bookingId: string;
  invitations: BookingInvitation[];
  canManage?: boolean;
  highlight?: boolean;
  departments?: Department[];
  selectedDepartmentIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredInvitations = useMemo(
    () =>
      invitations.filter((invitation) => {
        if (invitation.status === "removed" || invitation.status === "declined") {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const label = getProfileLabel(invitation.invitedUser).toLowerCase();
        const email = invitation.invitedUser?.email.toLowerCase() ?? "";
        return label.includes(normalizedSearch) || email.includes(normalizedSearch);
      }),
    [invitations, normalizedSearch],
  );
  const visibleInvitations = filteredInvitations.slice(0, visibleCount);
  const showInvites = INTERNAL_INVITES_ENABLED;

  return (
    <section
      id="booking-participants"
      className={cn(
        "scroll-mt-24 grid gap-5 rounded-lg border bg-card p-5",
        highlight &&
          showInvites &&
          "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10 ring-2 ring-primary/25",
      )}
    >
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          {showInvites
            ? highlight
              ? "Invite participants to this meeting?"
              : "Participants"
            : "Departments"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {showInvites
            ? canManage
              ? "Add attendees and manage the departments included in this booking."
              : "Attendees and departments included in this booking."
            : canManage
              ? "Manage the departments included in this booking."
              : "Departments tagged on this booking."}
        </p>
      </div>

      {canManage ? (
        <div className="grid gap-5">
          {showInvites ? <InviteUserForm bookingId={bookingId} /> : null}
          <BookingDepartmentManager
            bookingId={bookingId}
            departments={departments}
            initialDepartmentIds={selectedDepartmentIds}
          />
        </div>
      ) : null}

      {showInvites && invitations.length > 0 ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full border border-border/75 bg-background px-3 py-1">
              {filteredInvitations.length} attendee
              {filteredInvitations.length === 1 ? "" : "s"}
            </span>
          </div>

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
                      <h3 className="truncate text-sm font-semibold tracking-normal">
                        {inviteeLabel}
                      </h3>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {invitation.invitedUser?.email ?? "Email unavailable"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Added {formatBookingDateTime(invitation.createdAt)}
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
              No attendees match this search.
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
      ) : showInvites ? (
        <EmptyState
          title="No invited attendees yet"
          description={
            canManage
              ? "Search for active internal staff when someone else should attend this booking."
              : "This booking has no invited attendees."
          }
        />
      ) : null}
    </section>
  );
}
