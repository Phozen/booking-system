"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cateringActionInitialState } from "@/lib/bookings/catering/action-state";
import { updateBookingCateringAction } from "@/lib/bookings/catering/actions";
import type { BookingCateringDetails } from "@/lib/bookings/catering/format";
import {
  cateringServingTimeOptions,
  cateringTypeOptions,
  formatCateringServingTime,
  formatCateringType,
} from "@/lib/bookings/catering/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { OverlayLoader } from "@/components/shared/overlay-loader";

export function CateringEditForm({
  bookingId,
  catering,
  canEdit,
  lockedMessage = "Catering details can no longer be edited for this booking.",
}: {
  bookingId: string;
  catering: BookingCateringDetails;
  canEdit: boolean;
  lockedMessage?: string;
}) {
  const [required, setRequired] = useState(catering.required);
  const [state, action, isPending] = useActionState(
    updateBookingCateringAction.bind(null, bookingId),
    cateringActionInitialState,
  );

  return (
    <section className="grid gap-4 rounded-lg border border-border/70 bg-card p-5 shadow-sm shadow-primary/5 ring-1 ring-primary/10">
      <OverlayLoader show={isPending} label="Saving catering details..." />
      <ActionToastEffect
        state={state}
        successTitle="Catering details updated"
        errorTitle="Catering not saved"
      />
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          Edit food & drinks / catering
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Update refreshment details for Admin/Facilities review. Changes are
          audit logged.
        </p>
      </div>

      {!canEdit ? (
        <Alert>
          <AlertDescription>{lockedMessage}</AlertDescription>
        </Alert>
      ) : null}

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          {state.status === "error" ? (
            <AlertCircle aria-hidden="true" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
          <AlertTitle>
            {state.status === "error" ? "Catering not saved" : "Catering saved"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <form action={action} className="grid gap-4">
        <fieldset
          className="grid gap-4 sm:grid-cols-2"
          disabled={!canEdit || isPending}
        >
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`cateringRequired-${bookingId}`}>
              Food/drinks required?
            </Label>
            <select
              id={`cateringRequired-${bookingId}`}
              name="cateringRequired"
              defaultValue={catering.required ? "yes" : "no"}
              onChange={(event) => setRequired(event.target.value === "yes")}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          {required ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor={`cateringType-${bookingId}`}>Request type</Label>
                <select
                  id={`cateringType-${bookingId}`}
                  name="cateringType"
                  defaultValue={catering.type ?? ""}
                  required
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                >
                  <option value="">Choose request type</option>
                  {cateringTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatCateringType(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`cateringPax-${bookingId}`}>
                  Number of pax
                </Label>
                <Input
                  id={`cateringPax-${bookingId}`}
                  name="cateringPax"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  defaultValue={catering.pax ?? ""}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`cateringServingTime-${bookingId}`}>
                  Serving time
                </Label>
                <select
                  id={`cateringServingTime-${bookingId}`}
                  name="cateringServingTime"
                  defaultValue={catering.servingTime ?? ""}
                  required
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                >
                  <option value="">Choose serving time</option>
                  {cateringServingTimeOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatCateringServingTime(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`cateringDietaryNotes-${bookingId}`}>
                  Dietary / special notes
                </Label>
                <textarea
                  id={`cateringDietaryNotes-${bookingId}`}
                  name="cateringDietaryNotes"
                  rows={3}
                  defaultValue={catering.dietaryNotes ?? ""}
                  placeholder="Halal, vegetarian, allergies, VIP requirements"
                  className="min-h-20 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`cateringNotes-${bookingId}`}>
                  Additional catering notes
                </Label>
                <textarea
                  id={`cateringNotes-${bookingId}`}
                  name="cateringNotes"
                  rows={3}
                  defaultValue={catering.notes ?? ""}
                  className="min-h-20 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                />
              </div>
            </>
          ) : null}
        </fieldset>

        {canEdit ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              <PendingButtonContent pending={isPending} pendingLabel="Saving...">
                Save catering details
              </PendingButtonContent>
            </Button>
          </div>
        ) : null}
      </form>
    </section>
  );
}
