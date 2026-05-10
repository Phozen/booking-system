import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-950 shadow-sm ring-1 ring-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100 dark:ring-rose-900/40",
        className,
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-900">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold tracking-normal">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-rose-800 dark:text-rose-200">
              {description}
            </p>
          ) : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
