import type { ReactNode } from "react";
import Link from "next/link";

import { getCompanyDisplayName } from "@/lib/settings/app-settings";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AuthShell({
  appName,
  companyName,
  children,
}: {
  appName: string;
  companyName: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle compact />
      </div>
      <div className="grid w-full max-w-md gap-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex rounded-sm text-2xl font-semibold tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {appName}
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Internal facilities for {getCompanyDisplayName({ companyName })}
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
