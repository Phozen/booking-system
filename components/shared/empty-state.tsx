import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border/70 bg-card/95 p-6 text-center text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </div>
      <h2 className="text-base font-semibold tracking-normal text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
