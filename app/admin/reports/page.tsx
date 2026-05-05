import { BarChart3, FileDown } from "lucide-react";

import { requireActiveReportAdmin } from "@/lib/admin/reports/actions";
import { getAdminReportsData } from "@/lib/admin/reports/queries";
import { parseReportFilters } from "@/lib/admin/reports/validation";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { AuditLogReportTable } from "@/components/admin/reports/audit-log-report-table";
import { BookingHistoryTable } from "@/components/admin/reports/booking-history-table";
import { CancelledBookingsTable } from "@/components/admin/reports/cancelled-bookings-table";
import { FacilityUtilizationTable } from "@/components/admin/reports/facility-utilization-table";
import { ReportFilters } from "@/components/admin/reports/report-filters";
import { SummaryCards } from "@/components/admin/reports/summary-cards";
import { UserBookingSummaryTable } from "@/components/admin/reports/user-booking-summary-table";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    dateFrom?: string | string[];
    dateTo?: string | string[];
    facilityId?: string | string[];
    status?: string | string[];
  }>;
}) {
  await requireActiveReportAdmin();
  const filters = parseReportFilters(await searchParams);
  const supabase = await createClient();
  const [facilities, reports] = await Promise.all([
    getAdminFacilities(supabase),
    getAdminReportsData(supabase, filters),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Reports and exports"
        description="Review booking activity, utilization, cancellation, user activity, and audit reports. CSV exports use the same filters and record export and audit logs."
      />

      <ReportFilters facilities={facilities} filters={filters} />
      <section className="grid gap-4" aria-labelledby="report-summary-heading">
        <div>
          <h2 id="report-summary-heading" className="font-semibold tracking-normal">
            Summary
          </h2>
          <p className="text-sm text-muted-foreground">
            Key metrics for the selected reporting period.
          </p>
        </div>
        <SummaryCards summary={reports.summary} />
      </section>

      <section className="grid gap-4 rounded-lg border bg-card p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <h2 className="font-semibold tracking-normal">MVP report set</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Booking history, facility utilization, user booking summary,
              cancelled bookings, and audit logs are implemented with CSV
              exports. Approval, maintenance closure, and blocked date reports
              are reserved for the next reporting expansion.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FileDown className="mt-0.5 size-4 text-muted-foreground" />
          <p className="text-sm leading-6 text-muted-foreground">
            Page tables show practical previews while CSV exports include the
            filtered rows loaded for each report type.
          </p>
        </div>
      </section>

      <BookingHistoryTable rows={reports.bookingHistory} />
      <FacilityUtilizationTable rows={reports.facilityUtilization} />
      <UserBookingSummaryTable rows={reports.userBookingSummary} />
      <CancelledBookingsTable rows={reports.cancelledBookings} />
      <AuditLogReportTable rows={reports.auditLogs} />
    </main>
  );
}
