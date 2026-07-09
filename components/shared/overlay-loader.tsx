import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function OverlayLoader({
  show,
  label = "Loading...",
  className
}: {
  show: boolean;
  label?: string;
  className?: string;
}) {
  if (!show) return null;
  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm duration-300 animate-in fade-in zoom-in-95 fill-mode-both", className)}>
      <div className="flex flex-col items-center gap-4 text-primary">
        <Loader2 className="size-10 animate-spin" aria-hidden="true" />
        <p className="text-lg font-semibold animate-pulse">{label}</p>
      </div>
    </div>
  );
}
