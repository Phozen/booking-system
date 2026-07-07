"use client";

import { useActionState, useState } from "react";

import type { Facility } from "@/lib/facilities/queries";
import { formatFacilityType } from "@/lib/facilities/format";
import {
  createRecurringBookingsAction,
  previewRecurringBookingAction,
  type RecurringBookingActionResult,
} from "@/lib/bookings/recurring/actions";
import {
  BOOKING_WORKING_HOURS_END,
  BOOKING_WORKING_HOURS_START,
} from "@/lib/bookings/validation";
import { formatBookingWindow } from "@/lib/bookings/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";

const initialState: RecurringBookingActionResult = {
  status: "idle",
  message: "",
};

export function RecurringBookingForm({
  facilities,
}: {
  facilities: Facility[];
}) {
  const [previewState, previewAction, previewPending] = useActionState(
    previewRecurringBookingAction,
    initialState,
  );
  const [createState, createAction, createPending] = useActionState(
    createRecurringBookingsAction,
    initialState,
  );
  const [endMode, setEndMode] = useState<"count" | "date">("count");
  const pending = previewPending || createPending;
  const latestState = createState.status !== "idle" ? createState : previewState;

  return (
    <form action={previewAction} className="grid gap-6 rounded-lg border border-border/70 bg-card p-5 shadow-sm ring-1 ring-primary/10">
      <ActionToastEffect
        state={latestState}
        successTitle={
          createState.status === "success"
            ? "Recurring booking created"
            : "Recurring preview ready"
        }
        errorTitle="Recurring booking failed"
      />
      {latestState.status !== "idle" ? (
        <Alert variant={latestState.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{latestState.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="facilityId">Facility</Label>
          <select
            id="facilityId"
            name="facilityId"
            disabled={pending || facilities.length === 0}
            required
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} - {facility.level} - {formatFacilityType(facility.type)} - Capacity {facility.capacity}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="date">First date</Label>
          <Input id="date" name="date" type="date" disabled={pending} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="attendeeCount">Attendee count</Label>
          <Input id="attendeeCount" name="attendeeCount" type="number" min={0} disabled={pending} />
        </div>
        <fieldset className="grid gap-2 sm:col-span-2">
          <legend className="text-sm font-medium">Time</legend>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
            <div className="grid min-w-0 gap-1">
              <Label htmlFor="startTime" className="text-xs text-muted-foreground">
                Start
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                min={BOOKING_WORKING_HOURS_START}
                max={BOOKING_WORKING_HOURS_END}
                disabled={pending}
                required
              />
            </div>
            <span className="pb-2 text-sm text-muted-foreground" aria-hidden="true">
              to
            </span>
            <div className="grid min-w-0 gap-1">
              <Label htmlFor="endTime" className="text-xs text-muted-foreground">
                End
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                min={BOOKING_WORKING_HOURS_START}
                max={BOOKING_WORKING_HOURS_END}
                disabled={pending}
                required
              />
            </div>
          </div>
        </fieldset>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="title">Purpose</Label>
          <Input id="title" name="title" maxLength={160} disabled={pending} required />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            disabled={pending}
            className="min-h-24 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          />
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-sky-200 bg-sky-50/60 p-4 text-sky-950 dark:border-sky-900 dark:bg-sky-950/25 dark:text-sky-100">
        <div>
          <h2 className="font-semibold tracking-normal">Recurrence</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview generated dates before creating any bookings. Conflicts are shown first.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              name="frequency"
              defaultValue="weekly"
              disabled={pending}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="intervalCount">Every</Label>
            <Input id="intervalCount" name="intervalCount" type="number" min={1} max={12} defaultValue={1} disabled={pending} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endMode">End by</Label>
            <select
              id="endMode"
              value={endMode}
              onChange={(event) => setEndMode(event.target.value as "count" | "date")}
              disabled={pending}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
            >
              <option value="count">Occurrence count</option>
              <option value="date">End date</option>
            </select>
          </div>
          {endMode === "count" ? (
            <div className="grid gap-2 sm:col-span-3">
              <Label htmlFor="occurrenceCount">Occurrence count</Label>
              <Input id="occurrenceCount" name="occurrenceCount" type="number" min={1} max={50} defaultValue={6} disabled={pending} />
            </div>
          ) : (
            <div className="grid gap-2 sm:col-span-3">
              <Label htmlFor="endsOn">End date</Label>
              <Input id="endsOn" name="endsOn" type="date" disabled={pending} />
            </div>
          )}
        </div>
        <FormFieldHelper id="recurrence-helper">
          Recurring booking v1 is capped at 50 generated occurrences. Only available occurrences are created after confirmation.
        </FormFieldHelper>
      </section>

      {previewState.occurrences?.length ? (
        <section className="grid gap-3 rounded-lg border border-border/70 bg-muted/30 p-4">
          <h2 className="font-semibold tracking-normal">Preview</h2>
          <div className="grid gap-2">
            {previewState.occurrences.map((occurrence) => (
              <div
                key={occurrence.sequence}
                className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">
                  #{occurrence.sequence} - {occurrence.date}
                </span>
                <span className="text-muted-foreground">
                  {occurrence.startsAt && occurrence.endsAt
                    ? formatBookingWindow(occurrence.startsAt, occurrence.endsAt)
                    : "Invalid time"}
                </span>
                <span
                  className={
                    occurrence.available
                      ? "font-semibold text-emerald-700 dark:text-emerald-300"
                      : "font-semibold text-rose-700 dark:text-rose-300"
                  }
                >
                  {occurrence.message}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="submit" variant="outline" disabled={pending || facilities.length === 0}>
          <PendingButtonContent pending={previewPending} pendingLabel="Checking dates...">
            Preview dates
          </PendingButtonContent>
        </Button>
        <Button
          type="submit"
          formAction={createAction}
          disabled={pending || facilities.length === 0}
        >
          <PendingButtonContent pending={createPending} pendingLabel="Creating series...">
            Create available occurrences
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
