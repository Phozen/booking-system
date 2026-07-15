"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Coffee } from "lucide-react";

import { cateringActionInitialState } from "@/lib/bookings/catering/action-state";
import { updateBookingCateringAction } from "@/lib/bookings/catering/actions";
import type { BookingCateringDetails } from "@/lib/bookings/catering/format";
import {
  cateringServingTimeOptions,
  formatCateringServingTime,
} from "@/lib/bookings/catering/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { OverlayLoader } from "@/components/shared/overlay-loader";

const drinkRequestItems = [
  { value: "Water", label: "Water" },
  { value: "Coffee", label: "Coffee" },
  { value: "Tea", label: "Tea" },
] as const;

const foodRequestItems = [
  { value: "Snacks", label: "Snacks" },
  { value: "Packed meals", label: "Packed meals" },
  { value: "Catering", label: "Catering" },
] as const;

function getInitialDrinkItems(catering: BookingCateringDetails) {
  if (catering.type === "coffee_tea") {
    return ["Coffee", "Tea"];
  }

  if (catering.type === "water") {
    return ["Water"];
  }

  return [];
}

function getInitialFoodItems(catering: BookingCateringDetails) {
  if (catering.type === "buffet_catering" || catering.type === "vip_catering") {
    return ["Catering"];
  }

  if (catering.type === "packed_meals") {
    return ["Packed meals"];
  }

  if (catering.type === "snacks" || catering.type === "light_refreshments") {
    return ["Snacks"];
  }

  return [];
}

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
  const [selectedDrinkItems, setSelectedDrinkItems] = useState<string[]>(() =>
    getInitialDrinkItems(catering),
  );
  const [selectedFoodItems, setSelectedFoodItems] = useState<string[]>(() =>
    getInitialFoodItems(catering),
  );
  const [otherDrinkRequest, setOtherDrinkRequest] = useState("");
  const [otherFoodRequest, setOtherFoodRequest] = useState("");
  const [cateringNotes, setCateringNotes] = useState(catering.notes ?? "");
  const [state, action, isPending] = useActionState(
    updateBookingCateringAction.bind(null, bookingId),
    cateringActionInitialState,
  );
  const drinkRequests = [
    ...selectedDrinkItems,
    otherDrinkRequest.trim() ? `Other drinks: ${otherDrinkRequest.trim()}` : "",
  ].filter(Boolean);
  const foodRequests = [
    ...selectedFoodItems,
    otherFoodRequest.trim() ? `Other food: ${otherFoodRequest.trim()}` : "",
  ].filter(Boolean);
  const derivedCateringType =
    selectedFoodItems.includes("Catering")
      ? "buffet_catering"
      : selectedFoodItems.includes("Packed meals")
        ? "packed_meals"
        : selectedFoodItems.includes("Snacks")
          ? "snacks"
          : selectedDrinkItems.includes("Coffee") || selectedDrinkItems.includes("Tea")
            ? "coffee_tea"
            : selectedDrinkItems.includes("Water")
              ? "water"
              : otherDrinkRequest.trim() || otherFoodRequest.trim()
                ? "other"
                : catering.type || "";
  const combinedCateringNotes = [
    drinkRequests.length > 0
      ? `Drinks: ${drinkRequests.join(", ")}`
      : "",
    foodRequests.length > 0 ? `Food: ${foodRequests.join(", ")}` : "",
    cateringNotes.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");

  function toggleRequestItem(
    value: string,
    setter: (updater: (current: string[]) => string[]) => void,
  ) {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

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
            <Label
              htmlFor={`cateringRequired-${bookingId}`}
              className="inline-flex items-center gap-2"
            >
              <Coffee className="size-4 text-amber-700 dark:text-amber-300" aria-hidden="true" />
              Food/drinks required?
            </Label>
            <Select
              id={`cateringRequired-${bookingId}`}
              name="cateringRequired"
              defaultValue={catering.required ? "yes" : "no"}
              onChange={(event) => setRequired(event.target.value === "yes")}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </div>

          {required ? (
            <>
              <input
                type="hidden"
                name="cateringType"
                value={derivedCateringType}
              />

              <div className="grid gap-4 sm:col-span-2 lg:grid-cols-2">
                <fieldset className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3">
                  <legend className="px-1 text-sm font-semibold">
                    Drinks
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {drinkRequestItems.map((item) => {
                      const checked = selectedDrinkItems.includes(item.value);

                      return (
                        <label
                          key={item.value}
                          className="flex min-h-10 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleRequestItem(item.value, setSelectedDrinkItems)
                            }
                            className="size-4 accent-amber-600"
                          />
                          {item.label}
                        </label>
                      );
                    })}
                  </div>
                  <label className="grid gap-1 text-sm font-medium">
                    Other:
                    <Input
                      value={otherDrinkRequest}
                      onChange={(event) =>
                        setOtherDrinkRequest(event.target.value)
                      }
                      placeholder="Specify drinks"
                    />
                  </label>
                </fieldset>

                <fieldset className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3">
                  <legend className="px-1 text-sm font-semibold">
                    Food
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {foodRequestItems.map((item) => {
                      const checked = selectedFoodItems.includes(item.value);

                      return (
                        <label
                          key={item.value}
                          className="flex min-h-10 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleRequestItem(item.value, setSelectedFoodItems)
                            }
                            className="size-4 accent-amber-600"
                          />
                          {item.label}
                        </label>
                      );
                    })}
                  </div>
                  <label className="grid gap-1 text-sm font-medium">
                    Other:
                    <Input
                      value={otherFoodRequest}
                      onChange={(event) =>
                        setOtherFoodRequest(event.target.value)
                      }
                      placeholder="Specify food"
                    />
                  </label>
                </fieldset>
              </div>

              {(drinkRequests.length > 0 || foodRequests.length > 0) ? (
                <div className="grid gap-2 sm:col-span-2">
                  <p className="text-sm font-medium">Selected requests</p>
                  <div className="flex flex-wrap gap-2">
                    {[...drinkRequests, ...foodRequests].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

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
                <Select
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
                </Select>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`cateringDietaryNotes-${bookingId}`}>
                  Dietary / special notes
                </Label>
                <Textarea
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
                <Textarea
                  id={`cateringNotes-${bookingId}`}
                  rows={3}
                  value={cateringNotes}
                  onChange={(event) => setCateringNotes(event.target.value)}
                  className="min-h-20 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                />
                <input
                  type="hidden"
                  name="cateringNotes"
                  value={combinedCateringNotes}
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
