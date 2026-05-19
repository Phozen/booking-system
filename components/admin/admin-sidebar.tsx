import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

import { AdminNavigation } from "@/components/shared/nav-links";
import { UserMenu } from "@/components/shared/user-menu";
import { buttonVariants } from "@/components/ui/button";

export function AdminSidebar({
  appName,
  email,
  role,
}: {
  appName: string;
  email?: string | null;
  role?: string | null;
}) {
  return (
    <aside className="hidden min-h-svh w-72 shrink-0 border-r border-sidebar-border bg-sidebar/92 shadow-sm shadow-primary/5 print:hidden lg:block">
      <div className="sticky top-0 flex h-svh flex-col gap-6 p-4">
        <div className="border-b border-sidebar-border pb-4">
          <Link
            href="/admin/dashboard"
            className="rounded-sm text-base font-semibold tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {appName}
          </Link>
          <p className="mt-2 inline-flex rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-violet-900 dark:border-violet-800 dark:bg-violet-950/45 dark:text-violet-100">
            Admin console
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNavigation role={role} />
        </div>
        <div className="grid gap-3 border-t border-sidebar-border pt-4">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ArrowLeftRight data-icon="inline-start" />
            Employee side
          </Link>
          <UserMenu
            email={email}
            role={role}
            currentArea="admin"
            profileHref="/admin/profile"
            showModeSwitch={false}
            className="grid gap-3"
          />
        </div>
      </div>
    </aside>
  );
}
