import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AdminTableShell({
  title,
  description,
  actions,
  children,
  mobileCards,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  mobileCards?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm shadow-primary/5 ring-1 ring-primary/10",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border/70 bg-gradient-to-r from-muted/65 via-card to-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold tracking-normal">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {actions}
          </div>
        ) : null}
      </div>

      {mobileCards ? (
        <div className="grid gap-3 p-3 md:hidden">{mobileCards}</div>
      ) : null}

      <div
        className={cn(
          "overflow-x-auto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          mobileCards ? "hidden md:block" : "",
        )}
        tabIndex={0}
        aria-label={`${title} table`}
      >
        {!mobileCards ? (
          <p className="px-4 pt-3 text-xs text-muted-foreground md:hidden">
            Scroll horizontally to see more columns.
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
