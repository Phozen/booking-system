import { LoadingSpinnerBubble } from "@/components/shared/loading-spinner";
import { SkeletonCard, SkeletonTable } from "@/components/shared/skeleton";
import { cn } from "@/lib/utils";

export function RouteLoading({
  label = "Loading...",
  variant = "cards",
  className,
}: {
  label?: string;
  variant?: "cards" | "table" | "form";
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl content-center gap-8 px-4 py-10 sm:px-6",
        className,
      )}
    >
      <div className="mx-auto flex min-h-56 w-full max-w-sm flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
        <LoadingSpinnerBubble label={label} />
        <p className="font-medium text-foreground">{label}</p>
      </div>
      {variant === "table" ? (
        <SkeletonTable rows={6} columns={5} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard className={variant === "form" ? "sm:col-span-2" : ""} />
        </div>
      )}
    </main>
  );
}
