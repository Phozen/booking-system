export type BookingUsageStatus = "not_tracked" | "checked_in" | "no_show";

export function formatBookingUsageStatus(status: BookingUsageStatus) {
  const labels: Record<BookingUsageStatus, string> = {
    not_tracked: "Not tracked",
    checked_in: "Checked in",
    no_show: "No-show",
  };

  return labels[status] ?? "Not tracked";
}

export function canTrackBookingUsage(status: string) {
  return ["confirmed", "completed", "expired"].includes(status);
}
