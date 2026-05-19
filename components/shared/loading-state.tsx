import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function LoadingState({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-card/95 p-6 text-sm text-muted-foreground shadow-sm ring-1 ring-primary/10",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner label={label} showLabel className="text-primary" />
    </div>
  );
}
