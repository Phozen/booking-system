import Link from "next/link";

import { formatBookingDateTime } from "@/lib/bookings/format";
import type { AuditLog, AuditJsonValue } from "@/lib/admin/audit-logs/queries";
import { buttonVariants } from "@/components/ui/button";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function JsonPanel({
  title,
  value,
}: {
  title: string;
  value: AuditJsonValue;
}) {
  const formatted =
    value === null || value === undefined
      ? "null"
      : JSON.stringify(value, null, 2);

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <h2 className="font-semibold tracking-normal">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Read-only JSON snapshot captured with this audit event.
        </p>
      </div>
      <div className="max-w-full overflow-x-auto">
        <pre className="max-h-[420px] min-w-0 whitespace-pre-wrap break-words p-4 text-xs leading-5 text-muted-foreground">
        {formatted}
        </pre>
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="grid gap-1 rounded-lg border bg-card p-4">
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words text-sm">{value || "Not captured"}</dd>
    </div>
  );
}

export function AuditLogDetail({ auditLog }: { auditLog: AuditLog }) {
  return (
    <div className="grid gap-6">
      <section className="rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        This page is for review only. Audit logs cannot be edited or deleted
        from the application.
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem
          label="Created"
          value={formatBookingDateTime(auditLog.createdAt)}
        />
        <DetailItem label="Action" value={formatLabel(auditLog.action)} />
        <DetailItem label="Entity type" value={formatLabel(auditLog.entityType)} />
        <DetailItem label="Entity ID" value={auditLog.entityId} />
        <DetailItem label="Actor email" value={auditLog.actorEmail} />
        <DetailItem label="Actor user ID" value={auditLog.actorUserId} />
        <DetailItem label="IP address" value={auditLog.ipAddress} />
        <DetailItem label="User agent" value={auditLog.userAgent} />
        <DetailItem label="Summary" value={auditLog.summary} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <JsonPanel title="Metadata" value={auditLog.metadata} />
        <JsonPanel title="Old values" value={auditLog.oldValues} />
        <JsonPanel title="New values" value={auditLog.newValues} />
      </div>

      <div>
        <Link
          href="/admin/audit-logs"
          className={buttonVariants({ variant: "outline" })}
        >
          Back to audit logs
        </Link>
      </div>
    </div>
  );
}
