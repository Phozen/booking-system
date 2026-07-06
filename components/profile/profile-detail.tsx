import { CalendarClock, Mail, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { formatBookingDateTime } from "@/lib/bookings/format";
import type { UserProfile } from "@/lib/profile/queries";
import { StatusBadge } from "@/components/shared/status-badge";

function formatOptionalDate(value: string | null) {
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
    <div className="grid gap-1 border-b border-border/70 py-3 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

export function ProfileDetail({ profile }: { profile: UserProfile }) {
  return (
    <section className="grid content-start gap-5 border-t border-border/80 pt-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <UserRound className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-lg font-semibold tracking-normal">
              {profile.fullName || "Unnamed user"}
            </h2>
            <p className="mt-1 flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words leading-5 [overflow-wrap:anywhere]">
                {profile.email}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="user-role" status={profile.role} />
          <StatusBadge kind="user" status={profile.status} />
        </div>
      </div>

      <dl className="grid gap-0 sm:grid-cols-2 sm:gap-x-6">
        <DetailItem label="Department" value={profile.department || "Not set"} />
        <DetailItem
          label="Phone"
          value={
            <span className="inline-flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
              {profile.phone || "Not set"}
            </span>
          }
        />
        <DetailItem
          label="Last login"
          value={
            <span className="inline-flex items-center gap-2">
              <CalendarClock
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              {formatOptionalDate(profile.lastLoginAt)}
            </span>
          }
        />
        <DetailItem label="Created" value={formatBookingDateTime(profile.createdAt)} />
        <DetailItem label="Updated" value={formatBookingDateTime(profile.updatedAt)} />
        <DetailItem label="User ID" value={profile.id} />
      </dl>
    </section>
  );
}
