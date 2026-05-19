import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-lg border border-border/70 bg-card p-5 shadow-sm ring-1 ring-primary/10",
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-7 w-3/4" />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      className="rounded-lg border border-border/70 bg-card p-4 shadow-sm ring-1 ring-primary/10"
      aria-hidden="true"
    >
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-3 w-20" />
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-3 border-t border-border/70 pt-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${columnIndex}`}
                className="h-4 w-full"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
