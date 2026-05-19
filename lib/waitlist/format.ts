export type WaitlistStatus =
  | "open"
  | "suggested_alternative"
  | "closed"
  | "cancelled";

export const waitlistStatuses: WaitlistStatus[] = [
  "open",
  "suggested_alternative",
  "closed",
  "cancelled",
];

export function formatWaitlistStatus(status: WaitlistStatus) {
  const labels: Record<WaitlistStatus, string> = {
    open: "Open",
    suggested_alternative: "Alternative suggested",
    closed: "Closed",
    cancelled: "Cancelled",
  };

  return labels[status] ?? "Open";
}
