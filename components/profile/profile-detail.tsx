import { Mail, Phone, UserRound } from "lucide-react";

import type { UserProfile } from "@/lib/profile/queries";
import { StatusBadge } from "@/components/shared/status-badge";

export function ProfileDetail({ profile }: { profile: UserProfile }) {
  return (
    <section className="grid gap-4 border-b border-border pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="qbook-type-section break-words">
              {profile.fullName || "Unnamed user"}
            </h2>
            <p className="qbook-type-meta mt-1 flex min-w-0 items-center gap-2">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words leading-5 [overflow-wrap:anywhere]">
                {profile.email}
              </span>
            </p>
            {profile.department ? (
              <p className="qbook-type-meta mt-1">{profile.department}</p>
            ) : null}
            {profile.phone ? (
              <p className="qbook-type-meta mt-1 flex items-center gap-2">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                {profile.phone}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="user-role" status={profile.role} />
          <StatusBadge kind="user" status={profile.status} />
        </div>
      </div>
    </section>
  );
}
