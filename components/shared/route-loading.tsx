import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function RouteLoading({
  className,
}: {
  className?: string;
  label?: string; // Kept for compatibility but unused
  variant?: string; // Kept for compatibility but unused
}) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100svh-4rem)] w-full flex-col items-center justify-center gap-4 px-4 py-10 sm:px-6",
        "animate-in fade-in zoom-in-95 duration-500 ease-out fill-mode-both",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 text-primary">
        <Loader2 className="size-10 animate-spin" aria-hidden="true" />
        <p className="text-lg font-semibold animate-pulse text-foreground">Please wait...</p>
      </div>
    </div>
  );
}
