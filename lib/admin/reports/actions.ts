import "server-only";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLog } from "@/lib/audit/log";
import { getAdminReportsData } from "@/lib/admin/reports/queries";
import {
  buildReportCsv,
  getReportExportLabel,
  getReportExportSlug,
} from "@/lib/admin/reports/export";
import {
  parseReportFiltersFromSearchParams,
  serializeReportFilters,
} from "@/lib/admin/reports/validation";
import type { ReportExportType, ReportFilters } from "@/lib/admin/reports/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireActiveReportAdmin() {
  const authState = await requireAdmin();

  if (authState.profile?.status !== "active") {
    redirect("/login?error=disabled");
  }

  return authState;
}

function getExportFileName(type: ReportExportType, filters: ReportFilters) {
  return `${getReportExportSlug(type)}_${filters.dateFrom}_to_${filters.dateTo}.csv`;
}

async function recordReportExport({
  actorUserId,
  actorEmail,
  reportType,
  filters,
  fileName,
  rowCount,
}: {
  actorUserId: string;
  actorEmail?: string;
  reportType: ReportExportType;
  filters: ReportFilters;
  fileName: string;
  rowCount: number;
}) {
  const supabase = createAdminClient();
  const serializedFilters = serializeReportFilters(filters);
  const reportTypeSlug = getReportExportSlug(reportType);

  const { error: exportLogError } = await supabase.from("export_logs").insert({
    report_type: reportTypeSlug,
    filters: serializedFilters,
    exported_by: actorUserId,
    file_name: fileName,
    row_count: rowCount,
  });

  if (exportLogError) {
    throw new Error("Unable to record export log.");
  }

  await createAuditLog(supabase, {
    action: "export",
    entityType: "report",
    actorUserId,
    actorEmail,
    summary: `Exported ${getReportExportLabel(reportType)} CSV.`,
    metadata: {
      reportType: reportTypeSlug,
      filters: serializedFilters,
      fileName,
      rowCount,
    },
  });
}

export async function handleReportExportRoute(
  request: Request,
  reportType: ReportExportType,
) {
  const { user } = await requireActiveReportAdmin();

  if (!user) {
    redirect("/login?auth=required");
  }

  const filters = parseReportFiltersFromSearchParams(new URL(request.url).searchParams);
  const supabase = createAdminClient();
  const data = await getAdminReportsData(supabase, filters, {
    bookingLimit: 10_000,
    auditLimit: 10_000,
  });
  const { csv, rowCount } = buildReportCsv(data, reportType);
  const fileName = getExportFileName(reportType, filters);

  await recordReportExport({
    actorUserId: user.id,
    actorEmail: user.email,
    reportType,
    filters,
    fileName,
    rowCount,
  });

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
