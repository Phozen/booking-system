import { cn } from "@/lib/utils";

export type StatusBadgeKind =
  | "booking"
  | "facility"
  | "maintenance"
  | "email"
  | "blocked-period";

type StatusDefinition = {
  label: string;
  description: string;
  className: string;
  dotClassName: string;
};

const statusClasses = {
  amber:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  emerald:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  rose:
    "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  slate:
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
  sky:
    "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  zinc:
    "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200",
} as const;

const statusDots = {
  amber: "bg-amber-500",
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  slate: "bg-slate-500",
  sky: "bg-sky-600",
  zinc: "bg-zinc-500",
} as const;

const statusMaps: Record<StatusBadgeKind, Record<string, StatusDefinition>> = {
  booking: {
    pending: {
      label: "Pending Approval",
      description: "Waiting for admin review.",
      className: statusClasses.amber,
      dotClassName: statusDots.amber,
    },
    confirmed: {
      label: "Confirmed",
      description: "Booking is confirmed.",
      className: statusClasses.emerald,
      dotClassName: statusDots.emerald,
    },
    rejected: {
      label: "Rejected",
      description: "Booking request was rejected.",
      className: statusClasses.rose,
      dotClassName: statusDots.rose,
    },
    cancelled: {
      label: "Cancelled",
      description: "Booking was cancelled.",
      className: statusClasses.slate,
      dotClassName: statusDots.slate,
    },
    completed: {
      label: "Completed",
      description: "Booking has finished.",
      className: statusClasses.sky,
      dotClassName: statusDots.sky,
    },
    expired: {
      label: "Expired",
      description: "Booking request expired.",
      className: statusClasses.zinc,
      dotClassName: statusDots.zinc,
    },
  },
  facility: {
    active: {
      label: "Active",
      description: "Facility can be booked when available.",
      className: statusClasses.emerald,
      dotClassName: statusDots.emerald,
    },
    inactive: {
      label: "Inactive",
      description: "Facility is not currently bookable.",
      className: statusClasses.slate,
      dotClassName: statusDots.slate,
    },
    under_maintenance: {
      label: "Under Maintenance",
      description: "Facility is unavailable during maintenance.",
      className: statusClasses.sky,
      dotClassName: statusDots.sky,
    },
    archived: {
      label: "Archived",
      description: "Facility is hidden from normal booking flows.",
      className: statusClasses.zinc,
      dotClassName: statusDots.zinc,
    },
  },
  maintenance: {
    scheduled: {
      label: "Scheduled",
      description: "Maintenance is scheduled.",
      className: statusClasses.sky,
      dotClassName: statusDots.sky,
    },
    in_progress: {
      label: "In Progress",
      description: "Maintenance is currently in progress.",
      className: statusClasses.sky,
      dotClassName: statusDots.sky,
    },
    completed: {
      label: "Completed",
      description: "Maintenance is completed.",
      className: statusClasses.emerald,
      dotClassName: statusDots.emerald,
    },
    cancelled: {
      label: "Cancelled",
      description: "Maintenance closure was cancelled.",
      className: statusClasses.slate,
      dotClassName: statusDots.slate,
    },
  },
  email: {
    queued: {
      label: "Queued",
      description: "Email is waiting to be processed.",
      className: statusClasses.amber,
      dotClassName: statusDots.amber,
    },
    sending: {
      label: "Sending",
      description: "Email is currently being sent.",
      className: statusClasses.sky,
      dotClassName: statusDots.sky,
    },
    sent: {
      label: "Sent",
      description: "Email was sent successfully.",
      className: statusClasses.emerald,
      dotClassName: statusDots.emerald,
    },
    failed: {
      label: "Failed",
      description: "Email could not be sent.",
      className: statusClasses.rose,
      dotClassName: statusDots.rose,
    },
    cancelled: {
      label: "Cancelled",
      description: "Email notification was cancelled.",
      className: statusClasses.slate,
      dotClassName: statusDots.slate,
    },
  },
  "blocked-period": {
    active: {
      label: "Active",
      description: "Blocked period prevents affected bookings.",
      className: statusClasses.amber,
      dotClassName: statusDots.amber,
    },
    inactive: {
      label: "Inactive",
      description: "Blocked period no longer prevents bookings.",
      className: statusClasses.slate,
      dotClassName: statusDots.slate,
    },
  },
};

const kindLabels: Record<StatusBadgeKind, string> = {
  booking: "Booking",
  facility: "Facility",
  maintenance: "Maintenance",
  email: "Email",
  "blocked-period": "Blocked period",
};

export function StatusBadge({
  kind,
  status,
  className,
}: {
  kind: StatusBadgeKind;
  status: string | boolean;
  className?: string;
}) {
  const normalizedStatus =
    typeof status === "boolean" ? (status ? "active" : "inactive") : status;
  const definition = statusMaps[kind][normalizedStatus] ?? {
    label: normalizedStatus.replaceAll("_", " "),
    description: "Status is unavailable.",
    className: statusClasses.zinc,
    dotClassName: statusDots.zinc,
  };

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
        definition.className,
        className,
      )}
      aria-label={`${kindLabels[kind]} status: ${definition.label}. ${definition.description}`}
      title={definition.description}
    >
      <span
        className={cn("size-1.5 rounded-full", definition.dotClassName)}
        aria-hidden="true"
      />
      {definition.label}
    </span>
  );
}
