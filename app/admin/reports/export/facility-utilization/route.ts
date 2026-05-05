import { handleReportExportRoute } from "@/lib/admin/reports/actions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleReportExportRoute(request, "facility-utilization");
}

