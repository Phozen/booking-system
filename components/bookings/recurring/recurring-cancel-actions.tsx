"use client";

import { useActionState } from "react";

import {
  cancelRecurringFutureBookingsAction,
  cancelRecurringSeriesAction,
  type CancellationActionResult,
} from "@/lib/bookings/actions";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { Button } from "@/components/ui/button";

const initialState: CancellationActionResult = {
  status: "idle",
  message: "",
};

export function RecurringCancelActions({ bookingId }: { bookingId: string }) {
  const [futureState, futureAction, futurePending] = useActionState(
    cancelRecurringFutureBookingsAction.bind(null, bookingId),
    initialState,
  );
  const [seriesState, seriesAction, seriesPending] = useActionState(
    cancelRecurringSeriesAction.bind(null, bookingId),
    initialState,
  );
  const latestState = seriesState.status !== "idle" ? seriesState : futureState;

  return (
    <section className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-5 text-amber-950 shadow-sm shadow-amber-500/10 ring-1 ring-amber-200/60 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-100">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          Recurring booking controls
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Cancel this booking and future occurrences, or cancel the entire
          recurring series.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <form action={futureAction}>
          <Button type="submit" variant="warning" disabled={futurePending || seriesPending}>
            <PendingButtonContent pending={futurePending} pendingLabel="Cancelling future...">
              Cancel this and future
            </PendingButtonContent>
          </Button>
        </form>
        <form action={seriesAction}>
          <Button type="submit" variant="destructive" disabled={futurePending || seriesPending}>
            <PendingButtonContent pending={seriesPending} pendingLabel="Cancelling series...">
              Cancel entire series
            </PendingButtonContent>
          </Button>
        </form>
      </div>
      {latestState.status !== "idle" ? (
        <p className={latestState.status === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700 dark:text-emerald-300"}>
          {latestState.message}
        </p>
      ) : null}
    </section>
  );
}
