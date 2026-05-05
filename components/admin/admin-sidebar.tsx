import Link from "next/link";

import { appConfig } from "@/config/app";
import { AdminNavigation } from "@/components/shared/nav-links";
import { UserMenu } from "@/components/shared/user-menu";

export function AdminSidebar({
  email,
  role,
}: {
  email?: string | null;
  role?: string | null;
}) {
  return (
    <aside className="hidden min-h-svh w-72 shrink-0 border-r border-border/70 bg-card/80 lg:block">
      <div className="sticky top-0 flex h-svh flex-col gap-6 p-4">
        <div className="border-b border-border/70 pb-4">
          <Link
            href="/admin/dashboard"
            className="rounded-sm text-base font-semibold tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {appConfig.name}
          </Link>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Admin console
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNavigation />
        </div>
        <UserMenu email={email} role={role} className="grid gap-3 border-t pt-4" />
      </div>
    </aside>
  );
}
