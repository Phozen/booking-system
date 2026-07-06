import { LoadingSpinnerBubble } from "@/components/shared/loading-spinner";
import { Skeleton } from "@/components/shared/skeleton";

export default function AuthLoading() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <section
        className="grid w-full max-w-md gap-6 rounded-lg border border-border/70 bg-card p-6 shadow-sm ring-1 ring-primary/10"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
          <LoadingSpinnerBubble
            label="Loading secure form..."
            className="bg-background/80"
          />
          <p className="text-sm font-medium">Loading secure form...</p>
        </div>
        <div className="grid gap-3" aria-hidden="true">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>
    </main>
  );
}
