"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, UserRound, X } from "lucide-react";

import type { MissingProfileField } from "@/lib/profile/completion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProfileCompletionPrompt({
  missingFields,
  storageKey,
  className,
}: {
  missingFields: MissingProfileField[];
  storageKey: string;
  className?: string;
}) {
  const pathname = usePathname();
  const isDismissed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("profile-completion-prompt", onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("profile-completion-prompt", onStoreChange);
      };
    },
    () => window.sessionStorage.getItem(storageKey) === "dismissed",
    () => false,
  );

  if (
    pathname === "/profile" ||
    missingFields.length === 0 ||
    isDismissed
  ) {
    return null;
  }

  function dismissPrompt() {
    window.sessionStorage.setItem(storageKey, "dismissed");
    window.dispatchEvent(new Event("profile-completion-prompt"));
  }

  const formattedFields =
    missingFields.length === 1
      ? missingFields[0]
      : `${missingFields.slice(0, -1).join(", ")} and ${missingFields.at(-1)}`;

  return (
    <aside
      className={cn(
        "print:hidden",
        "mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8",
        className,
      )}
      aria-label="Profile completion reminder"
    >
      <div
        className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm ring-1 ring-amber-200/60 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-50 dark:ring-amber-500/20 sm:flex-row sm:items-start sm:justify-between"
        role="status"
        aria-live="polite"
      >
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
            <UserRound className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-normal">
              Complete your profile
            </h2>
            <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">
              Please add {formattedFields} so booking requests, approvals, and
              contact details are easier for the team to verify.
            </p>
            <ul className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
              {missingFields.map((field) => (
                <li
                  key={field}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white/70 px-2 py-1 text-amber-900 dark:border-amber-500/40 dark:bg-background/30 dark:text-amber-50"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  {field}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/profile"
            className={buttonVariants({ size: "sm", variant: "default" })}
          >
            Update profile
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-amber-950 hover:bg-amber-100 hover:text-amber-950 dark:text-amber-50 dark:hover:bg-amber-500/15 dark:hover:text-amber-50"
            onClick={dismissPrompt}
          >
            <X data-icon="inline-start" />
            Dismiss
          </Button>
        </div>
      </div>
    </aside>
  );
}
