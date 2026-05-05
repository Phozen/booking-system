import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import type { CancelledBookingRow } from "@/lib/admin/reports/types";

export function CancelledBookingsTable({
  rows,
}: {
  rows: CancelledBookingRow[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-4">
        <h2 className="font-semibold tracking-normal">Cancelled bookings</h2>
        <p className="text-sm text-muted-foreground">
          Cancellation reasons are included when users or admins provided them.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Facility</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Cancelled</th>
              <th className="px-4 py-3 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.slice(0, 25).map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">
                    {row.facility
                      ? `${row.facility.name}, ${row.facility.level}`
                      : "Unavailable"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.user?.fullName || row.user?.email || "Unknown"}
                  </td>
                  <td className="px-4 py-3">{formatBookingDate(row.startsAt)}</td>
                  <td className="px-4 py-3">
                    {formatBookingWindow(row.startsAt, row.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    {row.cancelledAt ? formatBookingDateTime(row.cancelledAt) : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.cancellationReason || "Not provided"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                  No cancelled bookings found for these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

