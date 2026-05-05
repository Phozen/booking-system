import { formatFacilityType } from "@/lib/facilities/format";
import type { FacilityUtilizationRow } from "@/lib/admin/reports/types";

export function FacilityUtilizationTable({
  rows,
}: {
  rows: FacilityUtilizationRow[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-4">
        <h2 className="font-semibold tracking-normal">Facility utilization</h2>
        <p className="text-sm text-muted-foreground">
          Booked hours are calculated from confirmed and completed bookings.
        </p>
      </div>
      <p className="px-4 pt-3 text-xs text-muted-foreground md:hidden">
        Scroll horizontally to see all columns.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Facility</th>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Confirmed</th>
              <th className="px-4 py-3 font-medium">Cancelled</th>
              <th className="px-4 py-3 font-medium">Booked hours</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.slice(0, 25).map((row) => (
                <tr key={row.facilityId} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    {row.facilityName}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {row.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.level}</td>
                  <td className="px-4 py-3">{formatFacilityType(row.type)}</td>
                  <td className="px-4 py-3">{row.totalBookings}</td>
                  <td className="px-4 py-3">{row.confirmedBookings}</td>
                  <td className="px-4 py-3">{row.cancelledBookings}</td>
                  <td className="px-4 py-3">{row.totalBookedHours}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                  No facility utilization found for these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
