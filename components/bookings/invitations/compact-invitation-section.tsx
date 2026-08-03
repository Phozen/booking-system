"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { InvitedBooking } from "@/lib/bookings/invitations/types";
import { MY_BOOKINGS_COMPACT_INITIAL_VISIBLE } from "@/components/bookings/compact-booking-section";
import { InvitationCard } from "@/components/bookings/invitations/invitation-card";
import { Button } from "@/components/ui/button";

export function CompactInvitationSection({
  sectionId,
  title,
  invitations,
  muted = false,
  compact = false,
  initialVisible = MY_BOOKINGS_COMPACT_INITIAL_VISIBLE,
}: {
  sectionId: string;
  title: string;
  invitations: InvitedBooking[];
  muted?: boolean;
  compact?: boolean;
  initialVisible?: number;
}) {
  const headingId = `${sectionId}-heading`;
  const listId = useId();
  const isCompactable = compact && invitations.length > initialVisible;
  const [expanded, setExpanded] = useState(false);
  const visibleInvitations =
    isCompactable && !expanded
      ? invitations.slice(0, initialVisible)
      : invitations;
  const hiddenCount = Math.max(invitations.length - initialVisible, 0);
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

      <div id={listId} className="grid gap-3">
        {visibleInvitations.map((invitation) => (
          <InvitationCard
            key={invitation.invitation.id}
            invitation={invitation}
            muted={muted}
          />
        ))}
      </div>

      {isCompactable ? (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? (
              <>
                <ChevronUp data-icon="inline-start" aria-hidden="true" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown data-icon="inline-start" aria-hidden="true" />
                Show {hiddenCount} more
              </>
            )}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
