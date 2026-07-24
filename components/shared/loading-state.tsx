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
        "flex items-center justify-center gap-2 rounded-lg border border-border/75 bg-card p-6 text-sm text-muted-foreground",
        "animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner label={label} showLabel className="text-primary" />
    </div>
  );
}
