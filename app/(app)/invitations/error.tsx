"use client";

import Link from "next/link";
import { CalendarDays, RotateCcw } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export default function InvitationsError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60svh] w-full max-w-3xl items-center px-4 py-10 sm:px-6">
      <ErrorState
        className="w-full"
        title="Your invitations could not be loaded."
        description="Check your connection, then try again."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={unstable_retry}>
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
              Try again
            </Button>
            <Link
              href="/calendar"
              className={buttonVariants({ variant: "outline" })}
            >
              <CalendarDays data-icon="inline-start" />
              View calendar
            </Link>
            <Link
              href="/my-bookings"
              className={buttonVariants({ variant: "ghost" })}
            >
              My bookings
            </Link>
          </div>
        }
      />
    </main>
  );
}
