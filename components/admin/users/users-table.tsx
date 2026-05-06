import Link from "next/link";
import { Eye } from "lucide-react";

import type { AdminUserProfile } from "@/lib/admin/users/queries";
import { formatUserRole, formatUserStatus } from "@/lib/admin/users/validation";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

function formatDateTime(value: string | null) {
  return value ? formatBookingDateTime(value) : "Not recorded";
}

function displayName(user: AdminUserProfile) {
  return user.fullName || user.email;
}

export function UsersTable({
  users,
  filtersActive,
}: {
  users: AdminUserProfile[];
  filtersActive: boolean;
}) {
  const emptyDescription = filtersActive
    ? "No users match the selected search or filters. Clear filters and try again."
    : "No user profiles were found. New Supabase Auth users should receive profiles automatically.";

  return (
    <AdminTableShell
      title="Users"
      description={`${users.length} profile records`}
      mobileCards={
        users.length > 0 ? (
          users.map((user) => (
            <MobileRecordCard
              key={user.id}
              eyebrow={user.email}
              title={displayName(user)}
              badges={
                <>
                  <StatusBadge kind="user-role" status={user.role} />
                  <StatusBadge kind="user" status={user.status} />
                </>
              }
              rows={[
                { label: "Department", value: user.department || "Not set" },
                { label: "Phone", value: user.phone || "Not set" },
                { label: "Last login", value: formatDateTime(user.lastLoginAt) },
                { label: "Created", value: formatBookingDateTime(user.createdAt) },
                { label: "Updated", value: formatBookingDateTime(user.updatedAt) },
              ]}
              actions={
                <Link
                  href={`/admin/users/${user.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Eye data-icon="inline-start" />
                  View and edit
                </Link>
              }
            />
          ))
        ) : (
          <EmptyState
            className="bg-transparent"
            title="No users found"
            description={emptyDescription}
          />
        )
      }
    >
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Last login</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <span className="block font-medium">{displayName(user)}</span>
                  <span className="block break-all text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="user-role" status={user.role} />
                  <span className="sr-only">{formatUserRole(user.role)}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="user" status={user.status} />
                  <span className="sr-only">{formatUserStatus(user.status)}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.department || "Not set"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.phone || "Not set"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(user.lastLoginAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatBookingDateTime(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatBookingDateTime(user.updatedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Eye data-icon="inline-start" />
                    View
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-8" colSpan={9}>
                <EmptyState
                  className="border-0 bg-transparent py-4"
                  title="No users found"
                  description={emptyDescription}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
