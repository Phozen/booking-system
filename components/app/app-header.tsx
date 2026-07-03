import Link from "next/link";

import { CompanyBrand } from "@/components/shared/company-logo";
import { EmployeeNavigation } from "@/components/shared/nav-links";
import { MobileNav } from "@/components/shared/mobile-nav";
import { UserMenu } from "@/components/shared/user-menu";

export function AppHeader({
  appName,
  email,
  role,
}: {
  appName: string;
  email?: string | null;
  role?: string | null;
}) {
  const mobileFooter = (
    <UserMenu
      email={email}
      role={role}
      currentArea="employee"
      profileHref="/profile"
      className="grid gap-3"
    />
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background print:hidden">
      <div className="relative mx-auto flex min-h-16 w-full max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link
            href="/dashboard"
            className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CompanyBrand
              logoClassName="w-24 sm:w-28"
              textClassName="text-xl"
              priority
            />
            <span className="sr-only">{appName}</span>
          </Link>
          <div className="hidden min-w-0 flex-1 overflow-hidden 2xl:flex">
            <EmployeeNavigation />
          </div>
        </div>
        <div className="hidden shrink-0 lg:block">
          <UserMenu
            email={email}
            role={role}
            showIdentity={false}
            currentArea="employee"
            profileHref="/profile"
            className="flex items-center gap-2"
          />
        </div>
        <MobileNav
          variant="employee"
          label="Menu"
          footer={mobileFooter}
          className="2xl:hidden"
        />
      </div>
    </header>
  );
}
