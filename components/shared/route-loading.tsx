import { LoadingSpinner } from "@/components/shared/loading-spinner";
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
        "mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoadingSpinner label={label} showLabel />
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
