import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, LockKeyhole, Sparkles } from "lucide-react";

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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,oklch(0.72_0.12_162_/_0.22),transparent_30%),radial-gradient(circle_at_84%_10%,oklch(0.72_0.15_78_/_0.20),transparent_26%),linear-gradient(135deg,oklch(0.985_0.006_252),oklch(0.95_0.02_248)_48%,oklch(0.985_0.006_252))] dark:bg-[radial-gradient(circle_at_18%_18%,oklch(0.55_0.12_162_/_0.20),transparent_30%),radial-gradient(circle_at_84%_10%,oklch(0.68_0.14_78_/_0.16),transparent_26%),linear-gradient(135deg,oklch(0.155_0.03_258),oklch(0.20_0.04_258)_48%,oklch(0.155_0.03_258))]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-[min(900px,90vw)] -translate-x-1/2 rounded-t-full border-x border-t border-primary/10 bg-card/35 blur-3xl" />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle compact className="size-11 bg-card/95 shadow-sm" />
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:gap-12">
        <div className="grid gap-8">
          <div className="grid gap-5">
            <Link
              href="/"
              className="inline-flex w-fit rounded-sm text-2xl font-semibold tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-3xl"
            >
              {appName}
            </Link>
            <div className="max-w-2xl space-y-4">
              <p className="w-fit rounded-full border border-primary/15 bg-card/70 px-3 py-1 text-sm font-medium text-primary shadow-sm backdrop-blur">
                {displayCompanyName}
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl">
                Start with your schedule, not another landing page.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Sign in once and get straight to bookings, invitations, and your
                calendar.
              </p>
            </div>
          </div>

          <div className="grid max-w-xl gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card/75 p-4 shadow-sm backdrop-blur">
              <CalendarDays className="mb-3 size-5 text-primary" aria-hidden="true" />
              <p className="text-sm font-medium">Calendar-first</p>
            </div>
            <div className="rounded-lg border bg-card/75 p-4 shadow-sm backdrop-blur">
              <LockKeyhole className="mb-3 size-5 text-emerald-600" aria-hidden="true" />
              <p className="text-sm font-medium">Company access</p>
            </div>
            <div className="rounded-lg border bg-card/75 p-4 shadow-sm backdrop-blur">
              <Sparkles className="mb-3 size-5 text-amber-600" aria-hidden="true" />
              <p className="text-sm font-medium">Ready to book</p>
            </div>
          </div>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
