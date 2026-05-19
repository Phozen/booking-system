import type { ReportSummary } from "@/lib/admin/reports/types";
import { formatBookingStatus } from "@/lib/bookings/format";

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function SummaryCards({ summary }: { summary: ReportSummary }) {
  const maxStatusCount = Math.max(
    1,
    ...summary.statusBreakdown.map((item) => item.count),
  );

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total bookings" value={summary.totalBookings} />
        <SummaryCard label="Confirmed" value={summary.confirmedBookings} />
        <SummaryCard label="Pending" value={summary.pendingBookings} />
        <SummaryCard label="Cancelled" value={summary.cancelledBookings} />
        <SummaryCard label="Rejected" value={summary.rejectedBookings} />
        <SummaryCard
          label="Booked hours"
          value={summary.totalBookedHours}
          helper="Confirmed and completed bookings"
        />
        <SummaryCard label="No-shows" value={summary.noShowBookings} />
        <SummaryCard
          label="Catering demand"
          value={summary.cateringRequests}
          helper={`${summary.cateringPax} pax requested`}
        />
        <SummaryCard
          label="Approval turnaround"
          value={
            summary.averageApprovalHours == null
              ? "None"
              : `${summary.averageApprovalHours}h`
          }
          helper="Average reviewed approval duration"
        />
        <SummaryCard
          label="Top facility"
          value={summary.mostBookedFacilities[0]?.facilityName ?? "None"}
          helper={summary.mostBookedFacilities[0]?.level}
        />
        <SummaryCard
          label="Most active user"
          value={summary.mostActiveUsers[0]?.userName ?? "None"}
          helper={summary.mostActiveUsers[0]?.email}
        />
      </section>
      <section className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold tracking-normal">Booking volume by status</h3>
        <div className="mt-4 grid gap-3">
          {summary.statusBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings in this period.</p>
          ) : (
            summary.statusBreakdown.map((item) => (
              <div key={item.status} className="grid gap-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{formatBookingStatus(item.status)}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(8, (item.count / maxStatusCount) * 100)}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
