import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-3xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-lg border border-border/75 bg-card p-6 text-center shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Page not found
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">
          This page isn’t available
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          The link may be outdated, or you may not have access to this record. No changes were made.
        </p>
        <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Return to sign in
          </Link>
          <Link href="/dashboard" className={buttonVariants()}>
            <LayoutDashboard data-icon="inline-start" aria-hidden="true" />
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
