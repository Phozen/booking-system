import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormFieldHelper({
  id,
  children,
  className,
}: {
  id: string;
  children?: ReactNode;
  className?: string;
}) {
  if (!children) {
    return null;
  }

  return (
    <p id={id} className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}
