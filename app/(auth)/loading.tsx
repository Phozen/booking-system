import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Skeleton } from "@/components/shared/skeleton";

export default function AuthLoading() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <section
        className="grid w-full max-w-md gap-5 rounded-lg border border-border/70 bg-card p-6 shadow-sm ring-1 ring-primary/10"
        role="status"
        aria-live="polite"
      >
        <LoadingSpinner label="Loading secure form..." showLabel />
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
