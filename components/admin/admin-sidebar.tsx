import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

import { CompanyBrand } from "@/components/shared/company-logo";
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
    <aside className="hidden min-h-svh w-72 shrink-0 border-r border-sidebar-border bg-sidebar print:hidden lg:block">
      <div className="qbook-office-panel sticky top-0 flex h-svh flex-col gap-5 p-4">
        <div className="border-b border-sidebar-border pb-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CompanyBrand logoClassName="w-32" textClassName="text-3xl" priority />
            <span className="sr-only">{appName}</span>
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            controlsClassName="flex-row flex-wrap items-center justify-start"
          />
        </div>
      </div>
    </aside>
  );
}
