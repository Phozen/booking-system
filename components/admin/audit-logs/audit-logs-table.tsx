import Link from "next/link";
import { Eye } from "lucide-react";

import { formatBookingDateTime } from "@/lib/bookings/format";
import {
  auditLogFiltersToSearchParams,
  type AuditLogFilters,
} from "@/lib/admin/audit-logs/validation";
import type { AuditLogListResult } from "@/lib/admin/audit-logs/queries";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

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
      description="Open a row to see IP, user agent, and captured changes."
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
                    <span className="capitalize">
                      {formatLabel(row.entityType)}
                    </span>
                  ),
                },
                { label: "Actor", value: row.actorEmail || "System" },
                { label: "Summary", value: row.summary || "No summary" },
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
          />
        )
      }
    >
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[22%]" />
          <col />
          <col className="w-[7.5rem]" />
        </colgroup>
        <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Entity</th>
            <th className="px-4 py-3 font-medium">Actor</th>
            <th className="px-4 py-3 font-medium">Summary</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.length > 0 ? (
            result.rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 align-middle">
                  <p className="min-w-0 break-words">
                    {formatBookingDateTime(row.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3 align-middle capitalize">
                  <p className="min-w-0 truncate" title={formatLabel(row.action)}>
                    {formatLabel(row.action)}
                  </p>
                </td>
                <td className="px-4 py-3 align-middle capitalize">
                  <p className="min-w-0 truncate" title={formatLabel(row.entityType)}>
                    {formatLabel(row.entityType)}
                  </p>
                </td>
                <td className="px-4 py-3 align-middle">
                  <p
                    className="min-w-0 truncate text-muted-foreground"
                    title={row.actorEmail || "System"}
                  >
                    {row.actorEmail || "System"}
                  </p>
                </td>
                <td className="px-4 py-3 align-middle text-muted-foreground">
                  <p
                    className="min-w-0 line-clamp-2 break-words"
                    title={row.summary || "No summary"}
                  >
                    {row.summary || "No summary"}
                  </p>
                </td>
                <td className="px-4 py-3 text-right align-middle">
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
              <td className="px-4 py-8" colSpan={6}>
                <EmptyState
                  className="border-0 bg-transparent py-4"
                  title="No audit logs found"
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
