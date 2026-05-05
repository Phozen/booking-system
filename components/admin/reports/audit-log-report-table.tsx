import { formatBookingDateTime } from "@/lib/bookings/format";
import type { AuditLogReportRow } from "@/lib/admin/reports/types";

export function AuditLogReportTable({ rows }: { rows: AuditLogReportRow[] }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-4">
        <h2 className="font-semibold tracking-normal">Audit logs</h2>
        <p className="text-sm text-muted-foreground">
          Recent audit activity for the selected period.
        </p>
      </div>
      <p className="px-4 pt-3 text-xs text-muted-foreground md:hidden">
        Scroll horizontally to see all columns.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Summary</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.slice(0, 50).map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">
                    {formatBookingDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3">
                    {row.entityType}
                    {row.entityId ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {row.entityId.slice(0, 8)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.actorEmail || "System"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.summary || "No summary"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                  No audit activity found for these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
