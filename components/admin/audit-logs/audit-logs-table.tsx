import Link from "next/link";
import { Eye } from "lucide-react";

import { formatBookingDateTime } from "@/lib/bookings/format";
import {
  auditLogFiltersToSearchParams,
  type AuditLogFilters,
} from "@/lib/admin/audit-logs/validation";
import type { AuditLogListResult, AuditJsonValue } from "@/lib/admin/audit-logs/queries";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

function previewJson(value: AuditJsonValue) {
  if (value === null || value === undefined) {
    return "None";
  }

  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text || text === "{}" || text === "[]") {
    return "None";
  }

  return text.length > 96 ? `${text.slice(0, 96)}...` : text;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function AuditLogsTable({
  result,
  filters,
}: {
  result: AuditLogListResult;
  filters: AuditLogFilters;
}) {
  const canGoBack = result.page > 1;
  const canGoForward = result.page < result.pageCount;
  const previousHref = `/admin/audit-logs?${auditLogFiltersToSearchParams(
    filters,
    { page: Math.max(1, result.page - 1) },
  ).toString()}`;
  const nextHref = `/admin/audit-logs?${auditLogFiltersToSearchParams(filters, {
    page: result.page + 1,
  }).toString()}`;

  return (
    <AdminTableShell
      title="Audit activity"
      description={`${result.totalCount} log records, page ${result.page} of ${result.pageCount}`}
      actions={
        <>
          <Link
            href={previousHref}
            aria-disabled={!canGoBack}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: !canGoBack ? "pointer-events-none opacity-50" : "",
            })}
          >
            Previous
          </Link>
          <Link
            href={nextHref}
            aria-disabled={!canGoForward}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: !canGoForward ? "pointer-events-none opacity-50" : "",
            })}
          >
            Next
          </Link>
        </>
      }
      mobileCards={
        result.rows.length > 0 ? (
          result.rows.map((row) => (
            <MobileRecordCard
              key={row.id}
              eyebrow={formatBookingDateTime(row.createdAt)}
              title={formatLabel(row.action)}
              rows={[
                {
                  label: "Entity",
                  value: (
                    <>
                      <span className="capitalize">
                        {formatLabel(row.entityType)}
                      </span>
                      {row.entityId ? (
                        <span className="block break-all text-xs text-muted-foreground">
                          {row.entityId}
                        </span>
                      ) : null}
                    </>
                  ),
                },
                { label: "Actor", value: row.actorEmail || "System" },
                { label: "Summary", value: row.summary || "No summary" },
                { label: "Metadata", value: previewJson(row.metadata) },
              ]}
              actions={
                <Link
                  href={`/admin/audit-logs/${row.id}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })}
                >
                  <Eye data-icon="inline-start" />
                  View detail
                </Link>
              }
            />
          ))
        ) : (
          <EmptyState
            className="bg-transparent"
            title="No audit logs found"
            description="No audit activity matches the selected filters."
          />
        )
      }
    >
        <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Summary</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">User agent</th>
              <th className="px-4 py-3 font-medium">Metadata</th>
              <th className="px-4 py-3 font-medium">Changes</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length > 0 ? (
              result.rows.map((row) => (
                <tr key={row.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    {formatBookingDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(row.action)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize">
                      {formatLabel(row.entityType)}
                    </span>
                    {row.entityId ? (
                      <span className="block text-xs text-muted-foreground">
                        {row.entityId}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {row.actorEmail || "System"}
                    {row.actorUserId ? (
                      <span className="block text-xs text-muted-foreground">
                        {row.actorUserId}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                    {row.summary || "No summary"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.ipAddress || ""}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-muted-foreground">
                    {row.userAgent || ""}
                  </td>
                  <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-muted-foreground">
                    {previewJson(row.metadata)}
                  </td>
                  <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-muted-foreground">
                    {previewJson({
                      oldValues: row.oldValues,
                      newValues: row.newValues,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/audit-logs/${row.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <Eye data-icon="inline-start" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8"
                  colSpan={10}
                >
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No audit logs found"
                    description="No audit activity matches the selected filters."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </AdminTableShell>
  );
}
