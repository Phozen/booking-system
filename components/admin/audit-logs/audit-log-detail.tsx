import Link from "next/link";

import { formatBookingDateTime } from "@/lib/bookings/format";
import type { AuditLog, AuditJsonValue } from "@/lib/admin/audit-logs/queries";
import { buttonVariants } from "@/components/ui/button";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

const sensitiveKeyPattern =
  /password|token|secret|api_?key|service_role|smtp_password|microsoft_client_secret|authorization|access_token|refresh_token/i;

function isRecord(value: AuditJsonValue): value is Record<string, AuditJsonValue> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeAuditValue(key: string, value: AuditJsonValue): AuditJsonValue {
  if (sensitiveKeyPattern.test(key)) {
    return value == null ? value : "[masked]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(key, item as AuditJsonValue));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nestedValue]) => [
        nestedKey,
        sanitizeAuditValue(nestedKey, nestedValue as AuditJsonValue),
      ]),
    );
  }

  return value;
}

function flattenAuditValue(
  value: AuditJsonValue,
  prefix = "",
): Record<string, AuditJsonValue> {
  if (!isRecord(value)) {
    return prefix ? { [prefix]: value } : {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, nestedValue]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (isRecord(nestedValue as AuditJsonValue)) {
        return Object.entries(flattenAuditValue(nestedValue as AuditJsonValue, path));
      }

      return [[path, sanitizeAuditValue(key, nestedValue as AuditJsonValue)]];
    }),
  );
}

function formatAuditValue(value: AuditJsonValue) {
  if (value === null || value === undefined || value === "") {
    return "Not captured";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildDiffRows(oldValues: AuditJsonValue, newValues: AuditJsonValue) {
  const oldFlat = flattenAuditValue(oldValues);
  const newFlat = flattenAuditValue(newValues);
  const keys = [...new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)])];

  return keys
    .map((key) => ({
      key,
      oldValue: oldFlat[key] ?? null,
      newValue: newFlat[key] ?? null,
    }))
    .filter(
      (row) =>
        JSON.stringify(row.oldValue) !== JSON.stringify(row.newValue),
    );
}

function JsonPanel({
  title,
  value,
}: {
  title: string;
  value: AuditJsonValue;
}) {
  const sanitized = sanitizeAuditValue(title, value);
  const formatted =
    sanitized === null || sanitized === undefined
      ? "null"
      : JSON.stringify(sanitized, null, 2);

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

function AuditDiffViewer({
  oldValues,
  newValues,
}: {
  oldValues: AuditJsonValue;
  newValues: AuditJsonValue;
}) {
  const rows = buildDiffRows(oldValues, newValues);

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <h2 className="font-semibold tracking-normal">Changed fields</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Human-readable comparison of captured old and new values. Sensitive
          fields are masked.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No field-level old/new differences were captured for this event.
        </p>
      ) : (
        <div className="grid gap-3 p-4">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 text-sm md:grid-cols-[14rem_1fr_1fr]"
            >
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Field
                </p>
                <p className="break-words font-medium">{formatLabel(row.key)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Old
                </p>
                <p className="break-words">{formatAuditValue(row.oldValue)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  New
                </p>
                <p className="break-words">{formatAuditValue(row.newValue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
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

      <AuditDiffViewer
        oldValues={auditLog.oldValues}
        newValues={auditLog.newValues}
      />

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
