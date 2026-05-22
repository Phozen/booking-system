"use client";

import { useActionState } from "react";

import {
  updateAdminWaitlistRequestAction,
  type WaitlistActionResult,
} from "@/lib/waitlist/actions";
import { formatWaitlistStatus, waitlistStatuses } from "@/lib/waitlist/format";
import type { WaitlistRequest } from "@/lib/waitlist/queries";
import { formatBookingWindow } from "@/lib/bookings/format";
import { EmptyState } from "@/components/shared/empty-state";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: WaitlistActionResult = {
  status: "idle",
  message: "",
};

function AdminWaitlistUpdateForm({ request }: { request: WaitlistRequest }) {
  const [state, action, isPending] = useActionState(
    updateAdminWaitlistRequestAction.bind(null, request.id),
    initialState,
  );

  return (
    <form action={action} className="grid gap-3 rounded-lg border border-border/70 bg-muted/35 p-3">
      <ActionToastEffect
        state={state}
        successTitle="Waitlist request updated"
        errorTitle="Waitlist update failed"
      />
      <div className="grid gap-2 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor={`status-${request.id}`}>Status</Label>
          <select
            id={`status-${request.id}`}
            name="status"
            defaultValue={request.status}
            disabled={isPending}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          >
            {waitlistStatuses.map((status) => (
              <option key={status} value={status}>
                {formatWaitlistStatus(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`adminResponse-${request.id}`}>Admin response / alternative</Label>
          <textarea
            id={`adminResponse-${request.id}`}
            name="adminResponse"
            rows={3}
            defaultValue={request.adminResponse ?? ""}
            disabled={isPending}
            className="min-h-20 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          <PendingButtonContent pending={isPending} pendingLabel="Saving...">
            Save
          </PendingButtonContent>
        </Button>
      </div>
      {state.status !== "idle" ? (
        <p className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700 dark:text-emerald-300"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function AdminWaitlistList({
  requests,
}: {
  requests: WaitlistRequest[];
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No waitlist requests"
        description="Employee waitlist and alternative-slot requests will appear here."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <article
          key={request.id}
          className="grid gap-4 rounded-lg border border-border/70 bg-card p-4 shadow-sm ring-1 ring-primary/5"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
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
            <dl className="grid gap-1 text-sm text-muted-foreground">
              <div>
                <dt className="inline font-medium text-foreground">Requester: </dt>
                <dd className="inline">
                  {request.requester?.fullName || request.requester?.email || "Unknown"}
                </dd>
              </div>
              {request.attendeeCount != null ? (
                <div>
                  <dt className="inline font-medium text-foreground">Attendees: </dt>
                  <dd className="inline">{request.attendeeCount}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          {request.reason ? (
            <p className="whitespace-pre-wrap text-sm leading-6">{request.reason}</p>
          ) : null}
          <AdminWaitlistUpdateForm request={request} />
        </article>
      ))}
    </div>
  );
}
