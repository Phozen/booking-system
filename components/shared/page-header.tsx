import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  backAction,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** Shown alone at the top, separate from title actions. */
  backAction?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("qbook-reveal grid gap-3 pb-6", className)}>
      {backAction ? (
        <div className="flex w-full justify-start">{backAction}</div>
      ) : null}
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="qbook-type-meta font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={cn("qbook-type-title", eyebrow ? "mt-1" : undefined)}>
          {title}
        </h1>
        {description ? (
          <div className="qbook-type-meta mt-2 max-w-2xl leading-6">
            {description}
          </div>
        ) : null}
      </div>
      {primaryAction || secondaryAction ? (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </header>
  );
}
