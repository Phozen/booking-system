export function BookingFormSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start lg:gap-8"
      aria-hidden
    >
      <div className="hidden gap-2 lg:grid">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
      <div className="grid gap-4">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-64 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="min-h-28 animate-pulse rounded-xl border border-border/80 bg-muted/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
