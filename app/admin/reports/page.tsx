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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Reports and exports"
      />

      <ReportFilters facilities={facilities} filters={filters} />
      <section className="grid gap-4" aria-labelledby="report-summary-heading">
        <div>
          <h2 id="report-summary-heading" className="font-semibold tracking-normal">
            Summary
          </h2>
        </div>
        <SummaryCards summary={reports.summary} />
      </section>

      <BookingHistoryTable rows={reports.bookingHistory} />
      <FacilityUtilizationTable rows={reports.facilityUtilization} />
      <UserBookingSummaryTable rows={reports.userBookingSummary} />
      <CancelledBookingsTable rows={reports.cancelledBookings} />
      <AuditLogReportTable rows={reports.auditLogs} />
    </main>
  );
}
