"use client";

import type { FormEvent } from "react";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarClock, CheckCircle2, Coffee, ShieldCheck, Users } from "lucide-react";

import {
  createBookingAction,
  type BookingActionResult,
} from "@/lib/bookings/actions";
import {
  bookingFormSchema,
  formDataToBookingValues,
  getBookingDateRange,
  validateBookingTimeWithinWindow,
} from "@/lib/bookings/validation";
import {
  cateringServingTimeOptions,
  formatCateringServingTime,
} from "@/lib/bookings/catering/format";
import type { Facility } from "@/lib/facilities/queries";
import {
  formatFacilityType,
} from "@/lib/facilities/format";
import {
  formatEffectiveApprovalLabel,
  formatBookingWindowLabel,
  type AppSettings,
} from "@/lib/settings/app-settings";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { showFormValidationError } from "@/components/shared/form-validation-toast";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { BookingAvailabilityTimeline } from "@/components/bookings/booking-availability-timeline";
import { FacilityPhoto } from "@/components/facilities/facility-photo";
import { OverlayLoader } from "@/components/shared/overlay-loader";

const initialState: BookingActionResult = {
  status: "idle",
  message: "",
};

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

type BookingFieldId =
  | "facilityId"
  | "date"
  | "startTime"
  | "endTime"
  | "title"
  | "description"
  | "attendeeCount"
  | "cateringType"
  | "cateringPax"
  | "cateringServingTime"
  | "cateringDietaryNotes"
  | "cateringNotes";

type BookingFieldErrors = Partial<Record<BookingFieldId, string>>;

type BookingPreviewValues = {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  attendeeCount: string;
};

function getFirstError(error?: string[]) {
  return error?.[0];
}

function getBookingAlertCopy(state: BookingActionResult) {
  if (state.status === "success") {
    return {
      title:
        state.bookingStatus === "pending"
          ? "Booking request submitted"
          : "Booking confirmed",
      message:
        state.bookingStatus === "pending"
          ? "Booking request submitted. It is pending admin approval."
          : "Booking confirmed.",
    };
  }

  const message = state.message.toLowerCase();

  if (message.includes("booked") || message.includes("time slot")) {
    return {
      title: "Booking conflict",
      message:
        "This facility is already booked for the selected time. Please choose another time or facility.",
    };
  }

  if (message.includes("blocked")) {
    return {
      title: "Facility unavailable",
      message: "This facility is unavailable during the selected time.",
    };
  }

  if (message.includes("maintenance")) {
    return {
      title: "Facility under maintenance",
      message: "This facility is under maintenance during the selected time.",
    };
  }

  return {
    title: "Booking unavailable",
    message: state.message,
  };
}

export function BookingForm({
  facilities,
  selectedFacilityId,
  initialDate,
  settings,
}: {
  facilities: Facility[];
  selectedFacilityId?: string;
  initialDate?: string;
  settings: AppSettings;
}) {
  const [state, formAction, isPending] = useActionState(
    createBookingAction,
    initialState,
  );
  const initialFacilityId =
    selectedFacilityId && facilities.some((facility) => facility.id === selectedFacilityId)
      ? selectedFacilityId
      : facilities[0]?.id ?? "";
  const hasFacilities = facilities.length > 0;
  const [selectedFacility, setSelectedFacility] = useState(initialFacilityId);
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
  const [cateringRequired, setCateringRequired] = useState(false);
  const [selectedDrinkItems, setSelectedDrinkItems] = useState<string[]>([]);
  const [selectedFoodItems, setSelectedFoodItems] = useState<string[]>([]);
  const [otherDrinkRequest, setOtherDrinkRequest] = useState("");
  const [otherFoodRequest, setOtherFoodRequest] = useState("");
  const [cateringNotes, setCateringNotes] = useState("");
  const [previewValues, setPreviewValues] = useState<BookingPreviewValues>({
    date: initialDate ?? "",
    startTime: "",
    endTime: "",
    title: "",
    attendeeCount: "",
  });
  const selectedFacilityDetails = useMemo(
    () => facilities.find((facility) => facility.id === selectedFacility),
    [facilities, selectedFacility],
  );
  const alertCopy =
    state.status !== "idle" ? getBookingAlertCopy(state) : null;
  const canRequestAlternative =
    state.status === "error" &&
    alertCopy &&
    ["Booking conflict", "Facility unavailable", "Facility under maintenance"].includes(
      alertCopy.title,
    );
  const hasPreviewDetails = Boolean(
    selectedFacilityDetails ||
      previewValues.date ||
      previewValues.startTime ||
      previewValues.endTime ||
      previewValues.title ||
      previewValues.attendeeCount,
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
                : "";
  const combinedCateringNotes = [
    drinkRequests.length > 0
      ? `Drinks: ${drinkRequests.join(", ")}`
      : "",
    foodRequests.length > 0 ? `Food: ${foodRequests.join(", ")}` : "",
    cateringNotes.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");

  function updatePreview(form: HTMLFormElement) {
    const formData = new FormData(form);
    const getValue = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : "";
    };

    setPreviewValues({
      date: getValue("date"),
      startTime: getValue("startTime"),
      endTime: getValue("endTime"),
      title: getValue("title"),
      attendeeCount: getValue("attendeeCount"),
    });
  }

  function setPreviewField<Key extends keyof BookingPreviewValues>(
    key: Key,
    value: BookingPreviewValues[Key],
  ) {
    setPreviewValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = bookingFormSchema.safeParse(formDataToBookingValues(formData));
    const nextErrors: BookingFieldErrors = {};

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      nextErrors.facilityId = getFirstError(errors.facilityId);
      nextErrors.date = getFirstError(errors.date);
      nextErrors.startTime = getFirstError(errors.startTime);
      nextErrors.endTime = getFirstError(errors.endTime);
      nextErrors.title = getFirstError(errors.title);
      nextErrors.description = getFirstError(errors.description);
      nextErrors.attendeeCount = getFirstError(errors.attendeeCount);
      nextErrors.cateringType = getFirstError(errors.cateringType);
      nextErrors.cateringPax = getFirstError(errors.cateringPax);
      nextErrors.cateringServingTime = getFirstError(
        errors.cateringServingTime,
      );
      nextErrors.cateringDietaryNotes = getFirstError(
        errors.cateringDietaryNotes,
      );
      nextErrors.cateringNotes = getFirstError(errors.cateringNotes);
    } else {
      const dateRange = getBookingDateRange(
        parsed.data,
        settings.defaultTimezone,
      );

      if (dateRange.message) {
        nextErrors.endTime = dateRange.message;
      }

      const windowMessage = validateBookingTimeWithinWindow(
        parsed.data,
        settings,
      );

      if (windowMessage) {
        nextErrors.endTime = windowMessage;
      }

      const attendeeCount =
        parsed.data.attendeeCount === "" || parsed.data.attendeeCount === undefined
          ? null
          : parsed.data.attendeeCount;

      if (
        selectedFacilityDetails &&
        attendeeCount !== null &&
        attendeeCount > selectedFacilityDetails.capacity
      ) {
        nextErrors.attendeeCount = `Attendee count should not exceed this facility's capacity of ${selectedFacilityDetails.capacity}.`;
      }
    }

    if (Object.values(nextErrors).some(Boolean)) {
      event.preventDefault();
      setFieldErrors(nextErrors);
      showFormValidationError(nextErrors);
      return;
    }

    setFieldErrors({});
  }

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
    <form
      action={formAction}
      className="grid gap-7"
      noValidate
      onChange={(event) => updatePreview(event.currentTarget)}
      onSubmit={validateBeforeSubmit}
    >
      <OverlayLoader show={isPending} label="Creating booking..." />

      <ActionToastEffect
        state={state}
        successTitle="Booking created"
        errorTitle="Booking could not be created"
      />

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          {state.status === "error" ? (
            <AlertCircle aria-hidden="true" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
          <AlertTitle>{alertCopy?.title}</AlertTitle>
          <AlertDescription>
            {alertCopy?.message}
            {canRequestAlternative ? (
              <span className="mt-2 block">
                <Link
                  href={`/waitlist${selectedFacility ? `?facilityId=${selectedFacility}` : ""}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Request waitlist / alternative
                </Link>
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {!hasFacilities ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No facilities available</AlertTitle>
          <AlertDescription>
            There are no active facilities available for booking.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 border-b-2 border-border pb-7">
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Step 1
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-normal">
            Venue
          </h2>
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="facilityId">Facility</Label>
          <select
            id="facilityId"
            name="facilityId"
            value={selectedFacility}
            onChange={(event) => setSelectedFacility(event.target.value)}
            disabled={!hasFacilities || isPending}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.facilityId && "facilityId-error",
            )}
            aria-invalid={Boolean(fieldErrors.facilityId)}
            required
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} - {facility.level} -{" "}
                {formatFacilityType(facility.type)} - Capacity{" "}
                {facility.capacity}
              </option>
            ))}
          </select>
          <FormFieldError id="facilityId-error">
            {fieldErrors.facilityId}
          </FormFieldError>
        </div>

        {selectedFacilityDetails ? (
          <aside className="grid gap-4 rounded-lg border border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-950 shadow-sm shadow-sky-500/10 ring-1 ring-sky-200/60 sm:col-span-2 sm:grid-cols-[180px_minmax(0,1fr)] dark:border-sky-900 dark:bg-sky-950/25 dark:text-sky-100">
            <div className="min-h-36 overflow-hidden rounded-md border border-sky-200 bg-background dark:border-sky-900">
              <FacilityPhoto
                facility={selectedFacilityDetails}
                className="aspect-[4/3] min-h-36"
              />
            </div>
            <div className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Selected facility
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">
                    {selectedFacilityDetails.name}
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    {selectedFacilityDetails.level} -{" "}
                    {formatFacilityType(selectedFacilityDetails.type)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-sky-800 dark:text-sky-200">
                  <Users className="size-4" aria-hidden="true" />
                  Capacity {selectedFacilityDetails.capacity}
                </div>
              </div>
              <div className="inline-flex items-start gap-2 text-sky-800 dark:text-sky-200">
                <ShieldCheck className="mt-0.5 size-4" aria-hidden="true" />
                <span>
                  {formatEffectiveApprovalLabel(
                    selectedFacilityDetails.requiresApproval,
                    settings,
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedFacilityDetails.equipment.length > 0
                  ? `Equipment: ${selectedFacilityDetails.equipment
                      .slice(0, 4)
                      .map((item) =>
                        item.quantity > 1
                          ? `${item.name} (${item.quantity})`
                          : item.name,
                      )
                      .join(", ")}${selectedFacilityDetails.equipment.length > 4 ? "..." : ""}`
                  : "No equipment listed."}
              </p>
            </div>
          </aside>
        ) : null}

      </section>

      <section className="grid gap-4 border-b-2 border-border pb-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Step 2
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-normal">
            Availability and Time
          </h2>
        </div>

        <div className="grid gap-2 sm:max-w-md">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={previewValues.date}
            onChange={(event) => setPreviewField("date", event.target.value)}
            disabled={!hasFacilities || isPending}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.date && "date-error",
            )}
            aria-invalid={Boolean(fieldErrors.date)}
            required
          />
          <FormFieldError id="date-error">{fieldErrors.date}</FormFieldError>
        </div>

        <BookingAvailabilityTimeline
          facilityId={selectedFacility}
          facilityName={selectedFacilityDetails?.name}
          date={previewValues.date}
          timezone={settings.defaultTimezone}
          bookingWindowStart={settings.bookingWindowStart}
          bookingWindowEnd={settings.bookingWindowEnd}
          startTime={previewValues.startTime}
          endTime={previewValues.endTime}
          onTimeChange={(startTime, endTime) =>
            setPreviewValues((current) => ({
              ...current,
              startTime,
              endTime,
            }))
          }
          disabled={!hasFacilities || isPending}
          locked={!previewValues.date}
          startTimeError={fieldErrors.startTime}
          endTimeError={fieldErrors.endTime}
        />
        <p className="text-sm text-muted-foreground">
          Booking hours: {formatBookingWindowLabel(settings)}.
        </p>
      </section>

      <section className="grid gap-5 border-b-2 border-border pb-7 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Step 3
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-normal">
            Details
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="title">Purpose</Label>
            <Input
              id="title"
              name="title"
              maxLength={160}
              placeholder="Meeting name / event name"
              value={previewValues.title}
              onChange={(event) => setPreviewField("title", event.target.value)}
              disabled={!hasFacilities || isPending}
              aria-describedby={getFieldDescribedBy(
                fieldErrors.title && "title-error",
              )}
              aria-invalid={Boolean(fieldErrors.title)}
              required
            />
            <FormFieldError id="title-error">{fieldErrors.title}</FormFieldError>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attendeeCount">Attendee count</Label>
            <Input
              id="attendeeCount"
              name="attendeeCount"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={
                selectedFacilityDetails
                  ? `Optional (Max. ${selectedFacilityDetails.capacity})`
                  : "Optional"
              }
              value={previewValues.attendeeCount}
              onChange={(event) =>
                setPreviewField("attendeeCount", event.target.value)
              }
              disabled={!hasFacilities || isPending}
              aria-describedby={getFieldDescribedBy(
                fieldErrors.attendeeCount && "attendeeCount-error",
              )}
              aria-invalid={Boolean(fieldErrors.attendeeCount)}
            />
            <FormFieldError id="attendeeCount-error">
              {fieldErrors.attendeeCount}
            </FormFieldError>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={5}
              disabled={!hasFacilities || isPending}
              aria-describedby={getFieldDescribedBy(
                fieldErrors.description && "description-error",
              )}
              aria-invalid={Boolean(fieldErrors.description)}
              className="min-h-28 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
            />
            <FormFieldError id="description-error">
              {fieldErrors.description}
            </FormFieldError>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cateringRequired" className="inline-flex items-center gap-2">
              <Coffee className="size-4 text-amber-700 dark:text-amber-300" aria-hidden="true" />
              Food/drinks required?
            </Label>
            <select
              id="cateringRequired"
              name="cateringRequired"
              defaultValue="no"
              onChange={(event) =>
                setCateringRequired(event.target.value === "yes")
              }
              disabled={!hasFacilities || isPending}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          {cateringRequired ? (
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
                            disabled={!hasFacilities || isPending}
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
                      disabled={!hasFacilities || isPending}
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
                            disabled={!hasFacilities || isPending}
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
                      disabled={!hasFacilities || isPending}
                      placeholder="Specify food"
                    />
                  </label>
                </fieldset>

                <div className="lg:col-span-2">
                  <FormFieldError id="cateringType-error">
                    {fieldErrors.cateringType
                      ? "Choose at least one food or drink item."
                      : undefined}
                  </FormFieldError>
                </div>
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
                <Label htmlFor="cateringPax">Number of pax</Label>
                <Input
                  id="cateringPax"
                  name="cateringPax"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  defaultValue={previewValues.attendeeCount}
                  disabled={!hasFacilities || isPending}
                  aria-describedby={getFieldDescribedBy(
                    fieldErrors.cateringPax && "cateringPax-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringPax)}
                  required
                />
                <FormFieldError id="cateringPax-error">
                  {fieldErrors.cateringPax}
                </FormFieldError>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cateringServingTime">Serving time</Label>
                <select
                  id="cateringServingTime"
                  name="cateringServingTime"
                  disabled={!hasFacilities || isPending}
                  aria-describedby={getFieldDescribedBy(
                    fieldErrors.cateringServingTime &&
                      "cateringServingTime-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringServingTime)}
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
                <FormFieldError id="cateringServingTime-error">
                  {fieldErrors.cateringServingTime}
                </FormFieldError>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="cateringDietaryNotes">
                  Dietary / special notes
                </Label>
                <textarea
                  id="cateringDietaryNotes"
                  name="cateringDietaryNotes"
                  rows={3}
                  placeholder="Vegetarian, halal, allergies, VIP requirements"
                  disabled={!hasFacilities || isPending}
                  aria-describedby={getFieldDescribedBy(
                    fieldErrors.cateringDietaryNotes &&
                      "cateringDietaryNotes-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringDietaryNotes)}
                  className="min-h-20 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                />
                <FormFieldError id="cateringDietaryNotes-error">
                  {fieldErrors.cateringDietaryNotes}
                </FormFieldError>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="cateringNotes">
                  Additional catering notes
                </Label>
                <textarea
                  id="cateringNotes"
                  rows={3}
                  value={cateringNotes}
                  onChange={(event) => setCateringNotes(event.target.value)}
                  disabled={!hasFacilities || isPending}
                  aria-describedby={getFieldDescribedBy(
                    fieldErrors.cateringNotes && "cateringNotes-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringNotes)}
                  className="min-h-20 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                />
                <input
                  type="hidden"
                  name="cateringNotes"
                  value={combinedCateringNotes}
                />
                <FormFieldError id="cateringNotes-error">
                  {fieldErrors.cateringNotes}
                </FormFieldError>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {hasPreviewDetails ? (
        <section className="grid gap-3 rounded-lg border-2 border-primary/55 bg-primary/10 p-4 shadow-md shadow-primary/10 ring-2 ring-primary/15">
          <div className="flex items-start gap-3">
            <CalendarClock
              className="mt-0.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-medium tracking-normal">Booking summary</h2>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Facility</dt>
              <dd className="font-medium">
                {selectedFacilityDetails
                  ? `${selectedFacilityDetails.name}, ${selectedFacilityDetails.level}`
                  : "Choose a facility"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-medium">
                {previewValues.date || "Choose a date"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Time</dt>
              <dd className="font-medium">
                {previewValues.startTime || "Start"} -{" "}
                {previewValues.endTime || "End"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Purpose</dt>
              <dd className="font-medium">
                {previewValues.title || "Enter a purpose"}
              </dd>
            </div>
            {previewValues.attendeeCount ? (
              <div>
                <dt className="text-muted-foreground">Attendees</dt>
                <dd className="font-medium">{previewValues.attendeeCount}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <Link
          href="/facilities"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={!hasFacilities || isPending}>
          <PendingButtonContent
            pending={isPending}
            pendingLabel="Creating booking..."
          >
            Create booking
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
