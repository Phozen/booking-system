import type { ReportSummary } from "@/lib/admin/reports/types";

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
  return (
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
  );
}

