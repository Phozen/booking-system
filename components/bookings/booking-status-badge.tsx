import type { BookingStatus } from "@/lib/bookings/queries";
import { StatusBadge } from "@/components/shared/status-badge";

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return <StatusBadge kind="booking" status={status} className={className} />;
}
