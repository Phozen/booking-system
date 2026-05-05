import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormFieldError({
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
    <p id={id} className={cn("text-sm font-medium text-destructive", className)}>
      {children}
    </p>
  );
}

export function getFieldDescribedBy(
  ...ids: Array<string | false | null | undefined>
) {
  const value = ids.filter(Boolean).join(" ");

  return value || undefined;
}
