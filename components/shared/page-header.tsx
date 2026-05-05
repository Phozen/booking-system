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
    <header className={cn("grid gap-4 border-b pb-6", className)}>
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-medium text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">
            {title}
          </h1>
          {description ? (
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {primaryAction || secondaryAction ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {secondaryAction}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </header>
  );
}
