"use client";

import { useActionState } from "react";

import {
  createWaitlistRequestAction,
  type WaitlistActionResult,
} from "@/lib/waitlist/actions";
import type { Facility } from "@/lib/facilities/queries";
import { formatFacilityType } from "@/lib/facilities/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";

const initialState: WaitlistActionResult = {
  status: "idle",
  message: "",
};

export function WaitlistRequestForm({
  facilities,
  defaultFacilityId,
}: {
  facilities: Facility[];
  defaultFacilityId?: string;
}) {
  const [state, action, isPending] = useActionState(
    createWaitlistRequestAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm ring-1 ring-primary/10">
      <ActionToastEffect
        state={state}
        successTitle="Waitlist request submitted"
        errorTitle="Waitlist request failed"
      />
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="facilityId">Requested facility</Label>
          <Select
            id="facilityId"
            name="facilityId"
            defaultValue={defaultFacilityId ?? ""}
            disabled={isPending}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          >
            <option value="">Any suitable facility</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} - {facility.level} - {formatFacilityType(facility.type)}
              </option>
            ))}
          </Select>
          <FormFieldHelper id="facilityId-helper">
            Pick the preferred room, or leave it open if alternatives are acceptable.
          </FormFieldHelper>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" disabled={isPending} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="attendeeCount">Attendee count</Label>
          <Input
            id="attendeeCount"
            name="attendeeCount"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Optional"
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" name="startTime" type="time" disabled={isPending} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" name="endTime" type="time" disabled={isPending} required />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="title">Purpose</Label>
          <Input
            id="title"
            name="title"
            maxLength={160}
            disabled={isPending}
            required
          />
          <FormFieldHelper id="title-helper">
            Briefly describe the meeting so Admin can suggest a practical alternative.
          </FormFieldHelper>
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="reason">Reason / flexibility notes</Label>
          <Textarea
            id="reason"
            name="reason"
            rows={5}
            disabled={isPending}
            placeholder="Preferred room, flexible time windows, equipment needs, or why this slot matters."
            className="min-h-28 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          />
          <FormFieldHelper id="reason-helper">
            This request does not reserve the slot or bypass booking conflict checks.
          </FormFieldHelper>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <PendingButtonContent pending={isPending} pendingLabel="Submitting request...">
            Request waitlist / alternative
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
