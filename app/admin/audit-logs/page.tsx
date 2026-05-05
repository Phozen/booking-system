import { requireActiveReportAdmin } from "@/lib/admin/reports/actions";
import { getAdminAuditLogs } from "@/lib/admin/audit-logs/queries";
import { parseAuditLogFilters } from "@/lib/admin/audit-logs/validation";
import { createClient } from "@/lib/supabase/server";
import { AuditLogFilters } from "@/components/admin/audit-logs/audit-log-filters";
import { AuditLogsTable } from "@/components/admin/audit-logs/audit-logs-table";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    dateFrom?: string | string[];
    dateTo?: string | string[];
    actorEmail?: string | string[];
    action?: string | string[];
    entityType?: string | string[];
    page?: string | string[];
  }>;
}) {
  await requireActiveReportAdmin();
  const filters = parseAuditLogFilters(await searchParams);
  const supabase = await createClient();
  const result = await getAdminAuditLogs(supabase, filters);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Audit logs"
        description="Review read-only activity records for booking, facility, approval, maintenance, notification, and report export actions."
      />

      <AuditLogFilters filters={filters} />
      <AuditLogsTable result={result} filters={filters} />
    </main>
  );
}
