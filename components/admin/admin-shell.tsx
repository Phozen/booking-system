import type { ReactNode } from "react";
import Link from "next/link";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { UserMenu } from "@/components/shared/user-menu";

export function AdminShell({
  appName,
  email,
  role,
  children,
}: {
  appName: string;
  email?: string | null;
  role?: string | null;
  children: ReactNode;
}) {
  const mobileFooter = (
    <UserMenu
      email={email}
      role={role}
      className="grid gap-3"
    />
  );

  return (
    <div className="flex min-h-svh bg-background">
      <AdminSidebar appName={appName} email={email} role={role} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-card/92 shadow-sm shadow-primary/5 backdrop-blur lg:hidden">
          <div className="relative flex min-h-16 items-center justify-between gap-4 px-4">
            <div>
              <Link
                href="/admin/dashboard"
                className="rounded-sm font-semibold tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {appName}
              </Link>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Admin console
              </p>
            </div>
            <MobileNav
              variant="admin"
              label="Menu"
              footer={mobileFooter}
              className="lg:hidden"
            />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
