"use client";

import { useActionState } from "react";

import {
  cancelWaitlistRequestAction,
  type WaitlistActionResult,
} from "@/lib/waitlist/actions";
import { formatWaitlistStatus } from "@/lib/waitlist/format";
import type { WaitlistRequest } from "@/lib/waitlist/queries";
import { formatBookingWindow } from "@/lib/bookings/format";
import { EmptyState } from "@/components/shared/empty-state";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { Button } from "@/components/ui/button";

const initialState: WaitlistActionResult = {
  status: "idle",
  message: "",
};

function CancelWaitlistButton({ requestId }: { requestId: string }) {
  const [state, action, isPending] = useActionState(
    cancelWaitlistRequestAction.bind(null, requestId),
    initialState,
  );

  return (
    <form action={action} className="grid gap-2">
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <PendingButtonContent pending={isPending} pendingLabel="Cancelling...">
          Cancel request
        </PendingButtonContent>
      </Button>
      {state.status === "error" ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}

export function WaitlistRequestList({
  requests,
}: {
  requests: WaitlistRequest[];
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No waitlist requests yet"
        description="When a preferred slot is unavailable, submit a request and Admin can review possible alternatives."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {requests.map((request) => {
        const canCancel =
          request.status === "open" || request.status === "suggested_alternative";

        return (
          <article
            key={request.id}
            className="grid gap-4 rounded-lg border border-border/70 bg-card p-4 shadow-sm ring-1 ring-primary/5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                  {formatWaitlistStatus(request.status)}
                </p>
                <h2 className="mt-1 text-base font-semibold tracking-normal">
                  {request.facility
                    ? `${request.facility.name}, ${request.facility.level}`
                    : "Any suitable facility"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatBookingWindow(request.startsAt, request.endsAt)}
                </p>
              </div>
              {canCancel ? <CancelWaitlistButton requestId={request.id} /> : null}
            </div>
            {request.attendeeCount != null ? (
              <p className="text-sm text-muted-foreground">
                Attendees requested: {request.attendeeCount}
              </p>
            ) : null}
            {request.reason ? (
              <p className="whitespace-pre-wrap text-sm leading-6">{request.reason}</p>
            ) : null}
            {request.adminResponse ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/25 dark:text-sky-100">
                <p className="font-medium">Admin response</p>
                <p className="mt-1 whitespace-pre-wrap">{request.adminResponse}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
