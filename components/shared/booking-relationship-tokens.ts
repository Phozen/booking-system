export type BookingRelationship = "owned" | "invited" | "other";

type BookingRelationshipToken = {
  label: string;
  shortLabel: string;
  description: string;
};

export const bookingRelationshipTokens = {
  owned: {
    label: "Your booking",
    shortLabel: "Yours",
    description: "A booking you created.",
  },
  invited: {
    label: "Invited",
    shortLabel: "Invited",
    description: "A booking you were invited to.",
  },
  other: {
    label: "Company booking",
    shortLabel: "Booked",
    description: "A booking owned by someone else. Limited details only.",
  },
} as const satisfies Record<BookingRelationship, BookingRelationshipToken>;

/** Chip / timeline surfaces — primary for owned, sky for invited. */
const bookingRelationshipSurfaceClasses: Record<BookingRelationship, string> = {
  owned:
    "border-primary/35 bg-primary/10 text-primary ring-1 ring-primary/20 dark:border-primary/45 dark:bg-primary/15 dark:text-primary",
  invited:
    "border-sky-300 bg-sky-50 text-sky-950 ring-1 ring-sky-200/70 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100",
  other:
    "border-border bg-muted/80 text-muted-foreground ring-1 ring-border dark:bg-muted/40",
};

/** Compact pill badges for relationship labels. */
const bookingRelationshipBadgeClasses: Record<BookingRelationship, string> = {
  owned:
    "border-primary/25 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15",
  invited:
    "border-sky-300/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100",
  other: "border-border bg-muted text-muted-foreground",
};

/** Legend swatch colors (solid enough to scan). */
const bookingRelationshipSwatchClasses: Record<BookingRelationship, string> = {
  owned: "bg-primary",
  invited: "bg-sky-500 dark:bg-sky-400",
  other: "bg-muted-foreground/70",
};

export function getBookingRelationshipToken(
  relationship: BookingRelationship,
): BookingRelationshipToken {
  return bookingRelationshipTokens[relationship];
}

export function getBookingRelationshipSurfaceClassName(
  relationship: BookingRelationship,
) {
  return bookingRelationshipSurfaceClasses[relationship];
}

export function getBookingRelationshipBadgeClassName(
  relationship: BookingRelationship,
) {
  return bookingRelationshipBadgeClasses[relationship];
}

export function getBookingRelationshipSwatchClassName(
  relationship: BookingRelationship,
) {
  return bookingRelationshipSwatchClasses[relationship];
}
