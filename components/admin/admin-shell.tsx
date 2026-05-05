import type { ReactNode } from "react";
import Link from "next/link";

import { appConfig } from "@/config/app";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { UserMenu } from "@/components/shared/user-menu";

export function AdminShell({
  email,
  role,
  children,
}: {
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
    <div className="flex min-h-svh bg-muted/20">
      <AdminSidebar email={email} role={role} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur lg:hidden">
          <div className="relative flex min-h-16 items-center justify-between gap-4 px-4">
            <div>
              <Link
                href="/admin/dashboard"
                className="rounded-sm font-semibold tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {appConfig.name}
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
