import { cn } from "@/lib/utils";

export type StatusBadgeKind =
  | "booking"
  | "facility"
  | "maintenance"
  | "email"
  | "calendar-sync"
  | "blocked-period"
  | "user"
  | "user-role"
  | "invitation";

type StatusDefinition = {
  label: string;
  description: string;
  className: string;
  dotClassName: string;
};

const statusClasses = {
  amber:
    "border-amber-300 bg-amber-50 text-amber-950 shadow-xs shadow-amber-500/10 dark:border-amber-800 dark:bg-amber-950/45 dark:text-amber-100",
  emerald:
    "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-xs shadow-emerald-500/10 dark:border-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-100",
  rose:
    "border-rose-300 bg-rose-50 text-rose-950 shadow-xs shadow-rose-500/10 dark:border-rose-800 dark:bg-rose-950/45 dark:text-rose-100",
  slate:
    "border-slate-300 bg-slate-50 text-slate-800 shadow-xs shadow-slate-500/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100",
  sky:
    "border-sky-300 bg-sky-50 text-sky-950 shadow-xs shadow-sky-500/10 dark:border-sky-800 dark:bg-sky-950/45 dark:text-sky-100",
  violet:
    "border-violet-300 bg-violet-50 text-violet-950 shadow-xs shadow-violet-500/10 dark:border-violet-800 dark:bg-violet-950/45 dark:text-violet-100",
  zinc:
    "border-zinc-300 bg-zinc-50 text-zinc-800 shadow-xs shadow-zinc-500/10 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100",
} as const;

const statusDots = {
  amber: "bg-amber-500",
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  slate: "bg-slate-500",
  sky: "bg-sky-600",
  violet: "bg-violet-600",
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
      className: statusClasses.emerald,
      dotClassName: statusDots.emerald,
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
      className: statusClasses.amber,
      dotClassName: statusDots.amber,
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
  "calendar-sync": {
    pending: {
      label: "Pending",
      description: "Calendar sync is waiting to run.",
      className: statusClasses.amber,
      dotClassName: statusDots.amber,
    },
    synced: {
      label: "Synced",
      description: "Calendar event is synced.",
      className: statusClasses.emerald,
      dotClassName: statusDots.emerald,
    },
    failed: {
      label: "Failed",
      description: "Calendar sync failed.",
      className: statusClasses.rose,
      dotClassName: statusDots.rose,
    },
    skipped: {
      label: "Skipped",
      description: "Calendar sync was skipped.",
      className: statusClasses.slate,
      dotClassName: statusDots.slate,
    },
    cancelled: {
      label: "Cancelled",
      description: "Calendar event was cancelled or removed.",
      className: statusClasses.zinc,
      dotClassName: statusDots.zinc,
    },
  },
  "blocked-period": {
    active: {
      label: "Active",
      description: "Blocked period prevents affected bookings.",
      className: statusClasses.rose,
      dotClassName: statusDots.rose,
    },
    inactive: {
      label: "Inactive",
      description: "Blocked period no longer prevents bookings.",
      className: statusClasses.slate,
      dotClassName: statusDots.slate,
    },
  },
  user: {
    active: {
      label: "Active",
      description: "User can access protected app pages.",
      className: statusClasses.emerald,
      dotClassName: statusDots.emerald,
    },
    disabled: {
      label: "Disabled",
      description: "User cannot access protected app pages.",
      className: statusClasses.rose,
      dotClassName: statusDots.rose,
    },
    pending: {
      label: "Pending",
      description: "User is waiting for admin activation.",
      className: statusClasses.amber,
      dotClassName: statusDots.amber,
    },
  },
  "user-role": {
    employee: {
      label: "Employee",
      description: "Regular employee account.",
      className: statusClasses.slate,
      dotClassName: statusDots.slate,
    },
    admin: {
      label: "Admin",
      description: "Operational administrator account.",
      className: statusClasses.violet,
      dotClassName: statusDots.violet,
    },
    super_admin: {
      label: "Super Admin",
      description: "System owner account with full administrative access.",
      className: statusClasses.violet,
      dotClassName: statusDots.violet,
    },
  },
  invitation: {
    pending: {
      label: "Pending",
      description: "Invitation is waiting for a response.",
      className: statusClasses.amber,
      dotClassName: statusDots.amber,
    },
    accepted: {
      label: "Accepted",
      description: "Invitation has been accepted.",
      className: statusClasses.emerald,
      dotClassName: statusDots.emerald,
    },
    declined: {
      label: "Declined",
      description: "Invitation has been declined.",
      className: statusClasses.rose,
      dotClassName: statusDots.rose,
    },
    removed: {
      label: "Removed",
      description: "Invitation has been removed.",
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
  "calendar-sync": "Calendar sync",
  "blocked-period": "Blocked period",
  user: "User",
  "user-role": "User role",
  invitation: "Invitation",
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
