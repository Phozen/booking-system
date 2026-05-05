import type { ReactNode } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  breadcrumbs,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <header
      className={cn(
        "grid gap-4 rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm",
        className,
      )}
    >
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <div className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {primaryAction || secondaryAction ? (
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {secondaryAction}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </header>
  );
}
