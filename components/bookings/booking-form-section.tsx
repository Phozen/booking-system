import type { ReactNode } from "react";
import { Check } from "lucide-react";

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

export type BookingWizardStepStatus =
  | "complete"
  | "current"
  | "upcoming"
  | "error";

export type BookingWizardStepItem = {
  step: number;
  label: string;
  status: BookingWizardStepStatus;
};

export function BookingWizardNav({
  steps,
  onSelect,
}: {
  steps: BookingWizardStepItem[];
  onSelect: (step: number) => void;
}) {
  return (
    <nav aria-label="Booking steps" className="lg:sticky lg:top-24">
      <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {steps.map((item) => {
          const isCurrent = item.status === "current";
          const isComplete = item.status === "complete";
          const isError = item.status === "error";

          return (
            <li key={item.step} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => onSelect(item.step)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
                  isCurrent &&
                    "border-primary/50 bg-primary/10 text-foreground",
                  isComplete &&
                    !isCurrent &&
                    "border-border/70 bg-card/80 text-foreground hover:border-primary/35 hover:bg-accent/40",
                  item.status === "upcoming" &&
                    "border-transparent bg-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/40",
                  isError &&
                    "border-destructive/50 bg-destructive/10 text-destructive",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    isCurrent && "bg-primary text-primary-foreground",
                    isComplete && !isCurrent && "bg-emerald-600 text-white",
                    item.status === "upcoming" &&
                      "bg-muted text-muted-foreground",
                    isError && "bg-destructive text-destructive-foreground",
                  )}
                  aria-hidden="true"
                >
                  {isComplete && !isCurrent ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    item.step
                  )}
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
