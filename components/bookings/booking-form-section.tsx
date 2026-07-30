import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function BookingFormSection({
  step,
  title,
  description,
  children,
  className,
}: {
  step?: number;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("qbook-form-section", className)}>
      <header className="grid gap-1">
        {step != null ? (
          <p className="qbook-type-meta font-medium tabular-nums text-muted-foreground">
            {step}
          </p>
        ) : null}
        <h2 className="qbook-type-section">{title}</h2>
        {description ? (
          <p className="qbook-type-meta max-w-2xl">{description}</p>
        ) : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function BookingStickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="qbook-sticky-actions">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        {children}
      </div>
    </div>
  );
}
