import type { BookingRelationship } from "@/components/shared/booking-relationship-tokens";
import {
  getBookingRelationshipSwatchClassName,
  getBookingRelationshipToken,
} from "@/components/shared/booking-relationship-tokens";
import { cn } from "@/lib/utils";

export function CalendarRelationshipLegend({
  items,
}: {
  items: { relationship: BookingRelationship; label?: string }[];
}) {
  return (
    <ul
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
      aria-label="Booking color key"
    >
      {items.map(({ relationship, label }) => {
        const token = getBookingRelationshipToken(relationship);
        const displayLabel = label ?? token.shortLabel;

        return (
          <li key={relationship} className="inline-flex items-center gap-2">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-sm",
                getBookingRelationshipSwatchClassName(relationship),
              )}
              aria-hidden="true"
            />
            <span className="qbook-type-meta text-muted-foreground">
              {displayLabel}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
