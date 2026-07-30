import type { ReactNode } from "react";

import { employeeCopy } from "@/lib/employee/plain-language";
import { cn } from "@/lib/utils";

export function BookingFormSection({
  step,
  totalSteps,
  title,
  description,
  children,
  className,
  hidden,
}: {
  step?: number;
  totalSteps?: number;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  hidden?: boolean;
}) {
  return (
    <section
      className={cn("qbook-form-section", className, hidden && "hidden")}
      aria-hidden={hidden || undefined}
      {...(hidden ? { inert: true } : {})}
    >
      <header className="grid gap-1">
        {step != null && totalSteps != null ? (
          <p className="qbook-type-meta font-medium tabular-nums text-muted-foreground">
            {employeeCopy.stepOf(step, totalSteps)}
          </p>
        ) : step != null ? (
          <p className="qbook-type-meta font-medium tabular-nums text-muted-foreground">
            {step}
          </p>
        ) : null}
        <h2 className="qbook-type-section text-xl sm:text-2xl">{title}</h2>
        {description ? (
          <p className="qbook-type-meta max-w-2xl text-base">{description}</p>
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
