import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireActiveReportAdmin } from "@/lib/admin/reports/actions";
import { getAdminAuditLogById } from "@/lib/admin/audit-logs/queries";
import { createClient } from "@/lib/supabase/server";
import { AuditLogDetail } from "@/components/admin/audit-logs/audit-log-detail";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Audit log detail"
        description="Full immutable audit record with captured metadata and before/after values. Audit records are read-only."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Audit Logs", href: "/admin/audit-logs" },
          { label: "Detail" },
        ]}
        secondaryAction={
          <Link
            href="/admin/audit-logs"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to audit logs
          </Link>
        }
      />

      <AuditLogDetail auditLog={auditLog} />
    </main>
  );
}
