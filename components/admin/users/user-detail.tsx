import type { ReactNode } from "react";

import type { AdminUserProfile } from "@/lib/admin/users/queries";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { StatusBadge } from "@/components/shared/status-badge";

function formatDateTime(value: string | null) {
  return value ? formatBookingDateTime(value) : "Not recorded";
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function UserDetail({ user }: { user: AdminUserProfile }) {
  return (
    <section className="grid gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm">
      <div>
        <h2 className="font-semibold tracking-normal">Profile details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only account identifiers and the current application profile state.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailItem label="Full name" value={user.fullName || "Not set"} />
        <DetailItem label="Email" value={<span className="break-all">{user.email}</span>} />
        <DetailItem label="Role" value={<StatusBadge kind="user-role" status={user.role} />} />
        <DetailItem label="Status" value={<StatusBadge kind="user" status={user.status} />} />
        <DetailItem label="Department" value={user.department || "Not set"} />
        <DetailItem label="Phone" value={user.phone || "Not set"} />
        <DetailItem label="Last login" value={formatDateTime(user.lastLoginAt)} />
        <DetailItem label="Created" value={formatBookingDateTime(user.createdAt)} />
        <DetailItem label="Updated" value={formatBookingDateTime(user.updatedAt)} />
        <DetailItem label="User ID" value={<span className="break-all font-mono text-xs">{user.id}</span>} />
      </dl>
    </section>
  );
}
