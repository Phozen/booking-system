import Link from "next/link";

import type { AppNotification } from "@/lib/notifications/app-notifications";
import { CompanyBrand } from "@/components/shared/company-logo";
import { EmployeeNavigation } from "@/components/shared/nav-links";
import { MobileNav } from "@/components/shared/mobile-nav";
import { UserMenu } from "@/components/shared/user-menu";

export function AppHeader({
  appName,
  email,
  role,
  notifications = [],
  unseenNotificationCount = 0,
}: {
  appName: string;
  email?: string | null;
  role?: string | null;
  notifications?: AppNotification[];
  unseenNotificationCount?: number;
}) {
  return (
    <header className="qbook-nav-photo sticky top-0 z-40 border-b border-border/80 print:hidden">
      <div className="relative mx-auto flex min-h-14 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:min-h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <Link
            href="/dashboard"
            className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CompanyBrand
              logoClassName="w-12 sm:w-14"
              textClassName="text-2xl sm:text-3xl"
              sizes="(min-width: 640px) 56px, 48px"
              priority
            />
            <span className="sr-only">{appName}</span>
          </Link>
          <div className="hidden min-w-0 flex-1 overflow-hidden xl:flex">
            <EmployeeNavigation />
          </div>
        </div>
        <div className="hidden shrink-0 xl:block">
          <UserMenu
            email={email}
            role={role}
            showIdentity={false}
            currentArea="employee"
            profileHref="/profile"
            notifications={notifications}
            unseenNotificationCount={unseenNotificationCount}
            className="flex items-center gap-2"
          />
        </div>
        <MobileNav
          variant="employee"
          label="Menu"
          userMenu={{
            email,
            role,
            currentArea: "employee",
            profileHref: "/profile",
            notifications,
            unseenNotificationCount,
          }}
          className="xl:hidden"
        />
      </div>
    </header>
  );
}
