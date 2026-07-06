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
} from "@/lib/bookings/validation";
import {
  cateringServingTimeOptions,
  cateringTypeOptions,
  formatCateringServingTime,
  formatCateringType,
} from "@/lib/bookings/catering/format";
import type { Facility } from "@/lib/facilities/queries";
import {
  formatFacilityType,
} from "@/lib/facilities/format";
import {
  formatEffectiveApprovalLabel,
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
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { BookingAvailabilityTimeline } from "@/components/bookings/booking-availability-timeline";
import { FacilityPhoto } from "@/components/facilities/facility-photo";

const initialState: BookingActionResult = {
  status: "idle",
  message: "",
};

const cateringRequestItems = [
  { value: "Drinking water", label: "Water" },
  { value: "Coffee / tea", label: "Coffee / tea" },
  { value: "Light refreshments", label: "Refreshments" },
  { value: "Snacks", label: "Snacks" },
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
  const [selectedCateringItems, setSelectedCateringItems] = useState<string[]>([]);
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
  const combinedCateringNotes = [
    selectedCateringItems.length > 0
      ? `Request list: ${selectedCateringItems.join(", ")}`
      : "",
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
      return;
    }

    setFieldErrors({});
  }

  function toggleCateringItem(value: string) {
    setSelectedCateringItems((current) =>
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
      <ActionToastEffect
        state={state}
        successTitle="Booking created"
        errorTitle="Booking unavailable"
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

      <section className="grid gap-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-50/35 p-4 ring-1 ring-border/70 dark:bg-blue-950/10">
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
              "facilityId-helper",
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
          <FormFieldHelper id="facilityId-helper">
            Select a room.
          </FormFieldHelper>
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

      <section className="grid gap-4 rounded-lg border-l-4 border-l-emerald-500 bg-emerald-50/35 p-4 ring-1 ring-border/70 dark:bg-emerald-950/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Step 2
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-normal">
            Time
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
              "date-helper",
              fieldErrors.date && "date-error",
            )}
            aria-invalid={Boolean(fieldErrors.date)}
            required
          />
          <FormFieldHelper id="date-helper">
            Uses {settings.defaultTimezone}.
          </FormFieldHelper>
          <FormFieldError id="date-error">{fieldErrors.date}</FormFieldError>
        </div>

        <BookingAvailabilityTimeline
          facilityId={selectedFacility}
          facilityName={selectedFacilityDetails?.name}
          date={previewValues.date}
          timezone={settings.defaultTimezone}
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
      </section>

      <section className="grid gap-5 rounded-lg border-l-4 border-l-amber-500 bg-amber-50/35 p-4 text-sm ring-1 ring-border/70 dark:bg-amber-950/10">
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
                "title-helper",
                fieldErrors.title && "title-error",
              )}
              aria-invalid={Boolean(fieldErrors.title)}
              required
            />
            <FormFieldHelper id="title-helper">
              Meeting name / event name.
            </FormFieldHelper>
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
                "attendeeCount-helper",
                fieldErrors.attendeeCount && "attendeeCount-error",
              )}
              aria-invalid={Boolean(fieldErrors.attendeeCount)}
            />
            <FormFieldHelper id="attendeeCount-helper">
              Optional
              {selectedFacilityDetails
                ? ` (Max. ${selectedFacilityDetails.capacity} people)`
                : ""}
            </FormFieldHelper>
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
                "description-helper",
                fieldErrors.description && "description-error",
              )}
              aria-invalid={Boolean(fieldErrors.description)}
              className="min-h-28 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
            />
            <FormFieldHelper id="description-helper">
              Optional notes.
            </FormFieldHelper>
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
              <div className="grid gap-2 sm:col-span-2">
                <Label>Request list</Label>
                <div className="flex flex-wrap gap-2">
                  {cateringRequestItems.map((item) => {
                    const selected = selectedCateringItems.includes(item.value);

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleCateringItem(item.value)}
                        disabled={!hasFacilities || isPending}
                        aria-pressed={selected}
                        className={
                          selected
                            ? "rounded-full border border-amber-500 bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors"
                            : "rounded-full border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-amber-400 hover:bg-amber-50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-amber-950/30"
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cateringType">Request type</Label>
                <select
                  id="cateringType"
                  name="cateringType"
                  disabled={!hasFacilities || isPending}
                  aria-describedby={getFieldDescribedBy(
                    fieldErrors.cateringType && "cateringType-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringType)}
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
                <FormFieldError id="cateringType-error">
                  {fieldErrors.cateringType}
                </FormFieldError>
              </div>

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
                    "cateringPax-helper",
                    fieldErrors.cateringPax && "cateringPax-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringPax)}
                  required
                />
                <FormFieldHelper id="cateringPax-helper">
                  Required pax.
                </FormFieldHelper>
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
                    "cateringServingTime-helper",
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
                <FormFieldHelper id="cateringServingTime-helper">
                  Required serving time.
                </FormFieldHelper>
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
                    "cateringDietaryNotes-helper",
                    fieldErrors.cateringDietaryNotes &&
                      "cateringDietaryNotes-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringDietaryNotes)}
                  className="min-h-20 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                />
                <FormFieldHelper id="cateringDietaryNotes-helper">
                  Allergies or dietary needs.
                </FormFieldHelper>
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
                    "cateringNotes-helper",
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
                <FormFieldHelper id="cateringNotes-helper">
                  Setup or supplier notes.
                </FormFieldHelper>
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
              <p className="mt-1 text-sm text-muted-foreground">
                Review the basics before creating your booking.
              </p>
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

      <div className="flex flex-col-reverse gap-3 border-t border-border/90 bg-muted/25 px-3 py-5 sm:flex-row sm:justify-end sm:px-0 [&>*]:w-full sm:[&>*]:w-auto">
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
