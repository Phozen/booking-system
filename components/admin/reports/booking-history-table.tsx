import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import { formatBookingUsageStatus } from "@/lib/bookings/usage";
import type { BookingHistoryRow } from "@/lib/admin/reports/types";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";

export function BookingHistoryTable({ rows }: { rows: BookingHistoryRow[] }) {
  const visibleRows = rows.slice(0, 25);

  return (
    <AdminTableShell
      title="Booking history"
      description={`${rows.length} matching bookings`}
    >
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Facility</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Approval</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">
                    {row.facility
                      ? `${row.facility.name}, ${row.facility.level}`
                      : "Unavailable"}
                  </td>
                  <td className="break-words px-4 py-3 text-muted-foreground">
                    {row.user?.fullName || row.user?.email || "Unknown"}
                  </td>
                  <td className="px-4 py-3">{formatBookingDate(row.startsAt)}</td>
                  <td className="px-4 py-3">
                    {formatBookingWindow(row.startsAt, row.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    {formatBookingUsageStatus(row.usageStatus)}
                  </td>
                  <td className="px-4 py-3">
                    {row.approvalRequired
                      ? row.approvalStatus ?? "Pending"
                      : "Not required"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatBookingDateTime(row.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={9}>
                  No booking history found for these filters.
                </td>
              </tr>
            )}
          </tbody>
      </table>
    </AdminTableShell>
  );
}
