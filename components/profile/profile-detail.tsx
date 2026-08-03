import { Mail, UserRound } from "lucide-react";

import type { UserProfile } from "@/lib/profile/queries";
import { StatusBadge } from "@/components/shared/status-badge";

export function ProfileDetail({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserRound className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          {profile.fullName ? (
            <p className="text-base font-semibold tracking-normal break-words">
              {profile.fullName}
            </p>
          ) : null}
          <p
            className={`flex min-w-0 items-center gap-2 text-sm text-muted-foreground ${profile.fullName ? "mt-1" : ""}`}
          >
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
  );
}
