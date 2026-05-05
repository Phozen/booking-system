import Link from "next/link";

import { appConfig } from "@/config/app";
import { EmployeeNavigation } from "@/components/shared/nav-links";
import { MobileNav } from "@/components/shared/mobile-nav";
import { UserMenu } from "@/components/shared/user-menu";

export function AppHeader({
  email,
  role,
}: {
  email?: string | null;
  role?: string | null;
}) {
  const mobileFooter = (
    <UserMenu
      email={email}
      role={role}
      className="grid gap-3"
    />
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/dashboard"
            className="shrink-0 rounded-sm text-base font-semibold tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {appConfig.name}
          </Link>
          <div className="hidden md:block">
            <EmployeeNavigation />
          </div>
        </div>
        <div className="hidden md:block">
          <UserMenu
            email={email}
            role={role}
            className="flex items-center gap-3"
          />
        </div>
        <MobileNav
          variant="employee"
          label="Menu"
          footer={mobileFooter}
          className="md:hidden"
        />
      </div>
    </header>
  );
}
