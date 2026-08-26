import { notFound } from "next/navigation";

import { requireActiveReportAdmin } from "@/lib/admin/reports/actions";
import { getAdminAuditLogById } from "@/lib/admin/audit-logs/queries";
import { createClient } from "@/lib/supabase/server";
import { AuditLogDetail } from "@/components/admin/audit-logs/audit-log-detail";
import { BackLink } from "@/components/shared/back-link";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireActiveReportAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const auditLog = await getAdminAuditLogById(supabase, id);

  if (!auditLog) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Audit log detail"
        backAction={
          <BackLink href="/admin/audit-logs">Back to audit logs</BackLink>
        }
      />

      <AuditLogDetail auditLog={auditLog} />
    </main>
  );
}
