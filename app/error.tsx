"use client";

import { RotateCcw } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60svh] w-full max-w-3xl items-center px-4 py-10 sm:px-6">
      <ErrorState
        className="w-full"
        title="We couldn't load this page"
        description="Check your connection, then try again."
        action={
          <Button type="button" onClick={unstable_retry}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Try again
          </Button>
        }
      />
    </main>
  );
}
