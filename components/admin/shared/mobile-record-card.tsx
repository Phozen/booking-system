import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MobileRecordCardRow = {
  label: string;
  value: ReactNode;
};

export function MobileRecordCard({
  eyebrow,
  title,
  badges,
  rows,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  badges?: ReactNode;
  rows: MobileRecordCardRow[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "grid gap-4 rounded-lg border border-border/70 bg-background p-4 shadow-sm",
        className,
      )}
    >
      <div className="grid gap-2">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold tracking-normal">{title}</h3>
          {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
        </div>
      </div>

      <dl className="grid gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1">
            <dt className="text-xs font-medium uppercase text-muted-foreground">
              {row.label}
            </dt>
            <dd className="text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>

      {actions ? (
        <div className="flex flex-wrap gap-2 border-t pt-3">{actions}</div>
      ) : null}
    </article>
  );
}
