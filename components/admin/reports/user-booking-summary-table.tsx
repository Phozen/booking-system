import type { UserBookingSummaryRow } from "@/lib/admin/reports/types";

export function UserBookingSummaryTable({
  rows,
}: {
  rows: UserBookingSummaryRow[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-4">
        <h2 className="font-semibold tracking-normal">User booking summary</h2>
        <p className="text-sm text-muted-foreground">
          Most active users for the selected period.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Confirmed</th>
              <th className="px-4 py-3 font-medium">Pending</th>
              <th className="px-4 py-3 font-medium">Cancelled</th>
              <th className="px-4 py-3 font-medium">Booked hours</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.slice(0, 25).map((row) => (
                <tr key={row.userId} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.userName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                  <td className="px-4 py-3">{row.totalBookings}</td>
                  <td className="px-4 py-3">{row.confirmedBookings}</td>
                  <td className="px-4 py-3">{row.pendingBookings}</td>
                  <td className="px-4 py-3">{row.cancelledBookings}</td>
                  <td className="px-4 py-3">{row.totalBookedHours}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                  No user booking activity found for these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

