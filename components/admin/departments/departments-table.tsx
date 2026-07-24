import Link from "next/link";
import { Eye } from "lucide-react";

import type { AdminDepartment } from "@/lib/admin/departments/queries";
import type { DepartmentFilters as DepartmentFilterValues } from "@/lib/admin/departments/validation";
import { DepartmentFilters } from "@/components/admin/departments/department-filters";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatBookingDateTime } from "@/lib/bookings/format";

export function DepartmentsTable({
  departments,
  filters,
}: {
  departments: AdminDepartment[];
  filters: DepartmentFilterValues;
}) {
  return (
    <AdminTableShell
      title="Departments"
      filters={<DepartmentFilters filters={filters} />}
      mobileCards={
        departments.length > 0 ? (
          departments.map((department) => (
            <MobileRecordCard
              key={department.id}
              eyebrow={department.email}
              title={department.name}
              badges={<StatusBadge kind="department" status={department.isActive} />}
              rows={[{ label: "Last updated", value: formatBookingDateTime(department.updatedAt) }]}
              actions={
                <Link href={`/admin/departments/${department.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Eye data-icon="inline-start" />
                  View and edit
                </Link>
              }
            />
          ))
        ) : (
          <EmptyState className="bg-transparent" title="No departments found" />
        )
      }
    >
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Mailbox</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Last updated</th>
            <th className="sticky right-0 border-l bg-muted/60 px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.length > 0 ? departments.map((department) => (
            <tr key={department.id} className="border-t align-top">
              <td className="px-4 py-3 font-medium">{department.name}</td>
              <td className="px-4 py-3 break-all text-muted-foreground">{department.email}</td>
              <td className="px-4 py-3"><StatusBadge kind="department" status={department.isActive} /></td>
              <td className="px-4 py-3 text-muted-foreground">{formatBookingDateTime(department.updatedAt)}</td>
              <td className="sticky right-0 border-l bg-background px-4 py-3 text-right">
                <Link href={`/admin/departments/${department.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Eye data-icon="inline-start" />
                  View
                </Link>
              </td>
            </tr>
          )) : (
            <tr><td className="px-4 py-8" colSpan={5}><EmptyState className="border-0 bg-transparent py-4" title="No departments found" /></td></tr>
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
