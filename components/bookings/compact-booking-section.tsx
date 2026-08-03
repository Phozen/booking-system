"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { EmployeeBooking } from "@/lib/bookings/queries";
import { BookingCard } from "@/components/bookings/booking-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const MY_BOOKINGS_COMPACT_INITIAL_VISIBLE = 5;

export function CompactBookingSection({
  sectionId,
  title,
  bookings,
  emptyMessage,
  emptyDescription,
  muted = false,
  highlightId,
  compact = false,
  initialVisible = MY_BOOKINGS_COMPACT_INITIAL_VISIBLE,
}: {
  sectionId: string;
  title: string;
  bookings: EmployeeBooking[];
  emptyMessage: string;
  emptyDescription?: string;
  muted?: boolean;
  highlightId?: string;
  compact?: boolean;
  initialVisible?: number;
}) {
  const headingId = `${sectionId}-heading`;
  const listId = useId();
  const highlightIndex = highlightId
    ? bookings.findIndex((booking) => booking.id === highlightId)
    : -1;
  const isCompactable = compact && bookings.length > initialVisible;
  const [expanded, setExpanded] = useState(
    isCompactable && highlightIndex >= initialVisible,
  );
  const visibleBookings =
    isCompactable && !expanded
      ? bookings.slice(0, initialVisible)
      : bookings;
  const hiddenCount = Math.max(bookings.length - initialVisible, 0);
  const countLabel =
    bookings.length === 1 ? "1 booking" : `${bookings.length} bookings`;

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
          {bookings.length}
        </span>
      </div>

      {bookings.length > 0 ? (
        <>
          <div id={listId} className="grid gap-3">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                muted={muted}
                highlighted={highlightId === booking.id}
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
        </>
      ) : (
        <EmptyState
          className="items-start p-4 text-left"
          title={emptyMessage}
          description={emptyDescription}
          titleAs="h3"
        />
      )}
    </section>
  );
}
