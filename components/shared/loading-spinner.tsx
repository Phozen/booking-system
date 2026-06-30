import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const spinnerSizes = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
  xl: "size-16 stroke-[1.8]",
} as const;

export function LoadingSpinner({
  size = "md",
  label = "Loading",
  showLabel = false,
  className,
}: {
  size?: keyof typeof spinnerSizes;
  label?: string;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={cn(
          "shrink-0 animate-spin text-current motion-reduce:animate-none",
          spinnerSizes[size],
        )}
        aria-hidden="true"
      />
      <span className={showLabel ? "min-w-0 truncate" : "sr-only"}>
        {label}
      </span>
    </span>
  );
}
