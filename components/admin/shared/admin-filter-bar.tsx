import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AdminFilterBar({
  title,
  description,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/70 bg-card/95 p-4 shadow-sm",
        className,
      )}
    >
      {title || description ? (
        <div className="mb-4">
          {title ? (
            <h2 className="font-semibold tracking-normal">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
