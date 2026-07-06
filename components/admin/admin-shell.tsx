import type { ReactNode } from "react";
import Link from "next/link";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CompanyBrand } from "@/components/shared/company-logo";
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
      currentArea="admin"
      profileHref="/admin/profile"
      className="grid gap-3"
      controlsClassName="flex-row flex-wrap items-center justify-start"
    />
  );

  return (
    <div className="qbook-office-surface flex min-h-svh bg-background">
      <AdminSidebar appName={appName} email={email} role={role} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur print:hidden lg:hidden">
          <div className="relative flex min-h-20 items-center justify-between gap-4 px-4">
            <div>
              <Link
                href="/admin/dashboard"
                className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CompanyBrand logoClassName="w-16" textClassName="text-4xl" priority />
                <span className="sr-only">{appName}</span>
              </Link>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Admin console
              </p>
            </div>
            <MobileNav
              variant="admin"
              label="Menu"
              footer={mobileFooter}
              role={role}
              className="lg:hidden"
            />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
