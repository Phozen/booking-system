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
  const displayCompanyName = getCompanyDisplayName({ companyName });

  return (
    <main className="relative flex min-h-svh overflow-hidden bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/office-login-background.png')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/95 via-background/76 to-background/38 dark:from-background/96 dark:via-background/82 dark:to-background/52" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/42 via-transparent to-background/20" />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle compact className="size-11 bg-card/95 shadow-sm" />
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:gap-12">
        <div className="self-start">
          <Link
            href="/"
            className="inline-flex w-fit rounded-sm text-2xl font-semibold tracking-normal text-foreground drop-shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-3xl"
          >
            {appName}
          </Link>
          <p className="mt-2 w-fit rounded-full border border-white/35 bg-card/75 px-3 py-1 text-sm font-medium text-foreground shadow-sm backdrop-blur">
            {displayCompanyName}
          </p>
        </div>

        <div className="w-full lg:self-center">{children}</div>
      </div>
    </main>
  );
}
