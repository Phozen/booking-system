import Link from "next/link";
import { Download, Filter, RotateCcw } from "lucide-react";

import {
  auditActionOptions,
  auditEntityTypeOptions,
  type AuditLogFilters,
} from "@/lib/admin/audit-logs/validation";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { buttonVariants } from "@/components/ui/button";

function formatOptionLabel(value: string) {
  if (value === "all") {
    return "All";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AuditLogFilters({ filters }: { filters: AuditLogFilters }) {
  const exportParams = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  return (
    <AdminFilterBar className="grid gap-4">
      <form className="grid gap-3 md:grid-cols-[repeat(5,minmax(0,1fr))_auto_auto] md:items-end [&>*]:min-w-0">
        <input type="hidden" name="page" value="1" />

        <div className="grid gap-2">
          <label htmlFor="dateFrom" className="text-sm font-medium">
            From
          </label>
          <input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={filters.dateFrom}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="dateTo" className="text-sm font-medium">
            To
          </label>
          <input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={filters.dateTo}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="actorEmail" className="text-sm font-medium">
            Actor email
          </label>
          <input
            id="actorEmail"
            name="actorEmail"
            type="search"
            defaultValue={filters.actorEmail ?? ""}
            placeholder="name@company.com"
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="action" className="text-sm font-medium">
            Action
          </label>
          <select
            id="action"
            name="action"
            defaultValue={filters.action ?? "all"}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {auditActionOptions.map((action) => (
              <option key={action} value={action}>
                {formatOptionLabel(action)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="entityType" className="text-sm font-medium">
            Entity type
          </label>
          <select
            id="entityType"
            name="entityType"
            defaultValue={filters.entityType ?? "all"}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {auditEntityTypeOptions.map((entityType) => (
              <option key={entityType} value={entityType}>
                {formatOptionLabel(entityType)}
              </option>
            ))}
          </select>
        </div>

        <button
          className={buttonVariants({
            variant: "outline",
            className: "w-full md:w-auto",
          })}
          type="submit"
        >
          <Filter data-icon="inline-start" />
          Apply
        </button>

        <Link
          href="/admin/audit-logs"
          className={buttonVariants({
            variant: "ghost",
            className: "w-full md:w-auto",
          })}
        >
          <RotateCcw data-icon="inline-start" />
          Reset
        </Link>
      </form>

      <div className="grid gap-2 border-t pt-4 sm:flex sm:flex-wrap sm:items-center">
        <Link
          href={`/admin/reports/export/audit-logs?${exportParams.toString()}`}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "w-full sm:w-auto",
          })}
        >
          <Download data-icon="inline-start" />
          Export audit CSV
        </Link>
        <p className="text-xs text-muted-foreground">
          CSV export reuses the report export route and applies the selected
          date range.
        </p>
      </div>
    </AdminFilterBar>
  );
}
