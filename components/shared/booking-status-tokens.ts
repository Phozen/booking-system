export type BookingStatusTone = "amber" | "emerald" | "rose" | "slate" | "zinc";

type BookingStatusToken = {
  label: string;
  description: string;
  tone: BookingStatusTone;
};

export const bookingStatusTokens = {
  pending: {
    label: "Pending Approval",
    description: "Waiting for admin review.",
    tone: "amber",
  },
  confirmed: {
    label: "Confirmed",
    description: "Booking is confirmed.",
    tone: "emerald",
  },
  rejected: {
    label: "Rejected",
    description: "Booking request was rejected.",
    tone: "rose",
  },
  cancelled: {
    label: "Cancelled",
    description: "Booking was cancelled.",
    tone: "slate",
  },
  completed: {
    label: "Completed",
    description: "Booking has finished.",
    tone: "emerald",
  },
  expired: {
    label: "Expired",
    description: "Booking request expired.",
    tone: "zinc",
  },
} as const satisfies Record<string, BookingStatusToken>;

const fallbackBookingStatusToken: BookingStatusToken = {
  label: "Unknown status",
  description: "Status is unavailable.",
  tone: "zinc",
};

const bookingStatusSurfaceClasses: Record<BookingStatusTone, string> = {
  amber:
    "border-amber-300 bg-amber-50 text-amber-950 ring-1 ring-amber-200/70 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-100",
  emerald:
    "border-emerald-300 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/70 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100",
  rose:
    "border-rose-300 bg-rose-50 text-rose-950 ring-1 ring-rose-200/70 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-100",
  slate:
    "border-slate-300 bg-slate-100 text-slate-800 ring-1 ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900/45 dark:text-slate-200",
  zinc:
    "border-zinc-300 bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-900/45 dark:text-zinc-200",
};

export function getBookingStatusToken(status: string): BookingStatusToken {
  return (
    bookingStatusTokens[status as keyof typeof bookingStatusTokens] ??
    fallbackBookingStatusToken
  );
}

export function getBookingStatusSurfaceClassName(status: string) {
  return bookingStatusSurfaceClasses[getBookingStatusToken(status).tone];
}
