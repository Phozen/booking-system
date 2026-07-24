import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function RouteLoading({
  className,
  label = "Loading...",
}: {
  className?: string;
  label?: string;
  variant?: string; // Kept for compatibility but unused
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-sm flex-col items-center justify-center gap-4 px-4 py-10 text-center sm:px-6",
        "animate-in fade-in zoom-in-95 duration-500 ease-out fill-mode-both",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 text-primary">
        <Loader2 className="size-10 animate-spin" aria-hidden="true" />
        <p className="text-lg font-semibold animate-pulse text-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
