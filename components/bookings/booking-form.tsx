"use client";

import type { FormEvent, ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Coffee, ShieldCheck, Users } from "lucide-react";

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
import type { Department } from "@/lib/departments/queries";
import {
  formatFacilityType,
} from "@/lib/facilities/format";
import {
  formatEffectiveApprovalLabel,
  formatBookingWindowLabel,
  getEffectiveApprovalRequired,
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { InitialAttendeePicker } from "@/components/bookings/initial-attendee-picker";
import { DepartmentPicker } from "@/components/bookings/department-picker";
import { FieldRequirementBadge } from "@/components/shared/field-requirement-badge";
import {
  BookingFormSection,
  BookingStickyActions,
} from "@/components/bookings/booking-form-section";

const initialState: BookingActionResult = {
  status: "idle",
  message: "",
};

function BookingFieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      <FieldRequirementBadge required={required} />
    </div>
  );
}

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
  departments,
}: {
  facilities: Facility[];
  selectedFacilityId?: string;
  initialDate?: string;
  settings: AppSettings;
  departments: Department[];
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
  const [teamsMeeting, setTeamsMeeting] = useState(false);
  const [selectedAttendeeCount, setSelectedAttendeeCount] = useState(0);
  const [selectedDepartmentCount, setSelectedDepartmentCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
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
  const hasCompletePreview = Boolean(
    selectedFacilityDetails &&
      previewValues.date &&
      previewValues.startTime &&
      previewValues.endTime &&
      previewValues.title,
  );
  const approvalRequired = selectedFacilityDetails
    ? getEffectiveApprovalRequired(
        selectedFacilityDetails.requiresApproval,
        settings,
      )
    : settings.defaultApprovalRequired;
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

    setIsDirty(true);
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
    setIsDirty(true);
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
      className="grid gap-0 pb-24"
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
          <AlertDescription>{alertCopy?.message}</AlertDescription>
        </Alert>
      ) : null}

      {!hasFacilities ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No facilities available</AlertTitle>
          <AlertDescription>
            There are no active facilities available for booking. Contact an
            administrator if this looks wrong.
          </AlertDescription>
        </Alert>
      ) : null}

      <BookingFormSection
        step={1}
        title="Venue"
        description="Choose the room or facility for this booking."
      >
        <div className="grid gap-2">
          <BookingFieldLabel htmlFor="facilityId" required>
            Facility
          </BookingFieldLabel>
          <Select
            id="facilityId"
            name="facilityId"
            value={selectedFacility}
            onChange={(event) => {
              setIsDirty(true);
              setSelectedFacility(event.target.value);
            }}
            disabled={!hasFacilities || isPending}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.facilityId && "facilityId-error",
            )}
            aria-invalid={Boolean(fieldErrors.facilityId)}
            required
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} - {facility.level} -{" "}
                {formatFacilityType(facility.type)} - Capacity{" "}
                {facility.capacity}
              </option>
            ))}
          </Select>
          <FormFieldError id="facilityId-error">
            {fieldErrors.facilityId}
          </FormFieldError>
        </div>

        {selectedFacilityDetails ? (
          <aside className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
            <div className="min-h-28 overflow-hidden rounded-md border border-border bg-card">
              <FacilityPhoto
                facility={selectedFacilityDetails}
                className="aspect-[4/3] min-h-28"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="qbook-type-meta">Selected facility</p>
                  <p className="qbook-type-section mt-0.5">
                    {selectedFacilityDetails.name}
                  </p>
                  <p className="qbook-type-meta mt-1">
                    {selectedFacilityDetails.level} ﾂｷ{" "}
                    {formatFacilityType(selectedFacilityDetails.type)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" aria-hidden="true" />
                  <span className="qbook-type-tabular text-sm">
                    Capacity {selectedFacilityDetails.capacity}
                  </span>
                </div>
              </div>
              <div className="inline-flex items-start gap-2 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="text-sm">
                  {formatEffectiveApprovalLabel(
                    selectedFacilityDetails.requiresApproval,
                    settings,
                  )}
                </span>
              </div>
              <p className="qbook-type-meta">
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
      </BookingFormSection>

      <BookingFormSection
        step={2}
        title="When"
        description="Pick a date, then select an available time on the timeline."
      >
        <div className="grid gap-2 sm:max-w-md">
          <BookingFieldLabel htmlFor="date" required>
            Date
          </BookingFieldLabel>
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
            className="qbook-type-tabular"
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
          onTimeChange={(startTime, endTime) => {
            setIsDirty(true);
            setPreviewValues((current) => ({
              ...current,
              startTime,
              endTime,
            }));
          }}
          disabled={!hasFacilities || isPending}
          locked={!previewValues.date}
          startTimeError={fieldErrors.startTime}
          endTimeError={fieldErrors.endTime}
        />
        <p className="qbook-type-meta">
          Booking hours: {formatBookingWindowLabel(settings)}.
        </p>
      </BookingFormSection>

      <BookingFormSection
        step={3}
        title="Details"
        description="Add the purpose and optional meeting details."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <BookingFieldLabel htmlFor="title" required>
              Purpose
            </BookingFieldLabel>
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
            <BookingFieldLabel htmlFor="attendeeCount" required={false}>
              Attendee count
            </BookingFieldLabel>
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
            <BookingFieldLabel htmlFor="description" required={false}>
              Description
            </BookingFieldLabel>
            <Textarea
              id="description"
              name="description"
              rows={5}
              disabled={!hasFacilities || isPending}
              aria-describedby={getFieldDescribedBy(
                fieldErrors.description && "description-error",
              )}
              aria-invalid={Boolean(fieldErrors.description)}
              className="min-h-28"
            />
            <FormFieldError id="description-error">
              {fieldErrors.description}
            </FormFieldError>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="cateringRequired" className="inline-flex items-center gap-2">
                <Coffee className="size-4 text-muted-foreground" aria-hidden="true" />
                Food or drinks required?
              </Label>
              <FieldRequirementBadge required={false} />
            </div>
            <Select
              id="cateringRequired"
              name="cateringRequired"
              defaultValue="no"
              onChange={(event) =>
                setCateringRequired(event.target.value === "yes")
              }
              disabled={!hasFacilities || isPending}
            >
              <option value="no">No</option>
              <option value="yes">Yes - show catering options</option>
            </Select>
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
                        className="rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2">
                <BookingFieldLabel htmlFor="cateringPax" required>
                  Number of pax
                </BookingFieldLabel>
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
                <BookingFieldLabel htmlFor="cateringServingTime" required>
                  Serving time
                </BookingFieldLabel>
                <Select
                  id="cateringServingTime"
                  name="cateringServingTime"
                  disabled={!hasFacilities || isPending}
                  aria-describedby={getFieldDescribedBy(
                    fieldErrors.cateringServingTime &&
                      "cateringServingTime-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringServingTime)}
                  required
                >
                  <option value="">Choose serving time</option>
                  {cateringServingTimeOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatCateringServingTime(option)}
                    </option>
                  ))}
                </Select>
                <FormFieldError id="cateringServingTime-error">
                  {fieldErrors.cateringServingTime}
                </FormFieldError>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <BookingFieldLabel htmlFor="cateringDietaryNotes" required={false}>
                  Dietary / special notes
                </BookingFieldLabel>
                <Textarea
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
                  className="min-h-20"
                />
                <FormFieldError id="cateringDietaryNotes-error">
                  {fieldErrors.cateringDietaryNotes}
                </FormFieldError>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <BookingFieldLabel htmlFor="cateringNotes" required={false}>
                  Additional catering notes
                </BookingFieldLabel>
                <Textarea
                  id="cateringNotes"
                  rows={3}
                  value={cateringNotes}
                  onChange={(event) => setCateringNotes(event.target.value)}
                  disabled={!hasFacilities || isPending}
                  aria-describedby={getFieldDescribedBy(
                    fieldErrors.cateringNotes && "cateringNotes-error",
                  )}
                  aria-invalid={Boolean(fieldErrors.cateringNotes)}
                  className="min-h-20"
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
      </BookingFormSection>

      <BookingFormSection
        step={4}
        title="People and options"
        description="Invite staff, tag departments, and set Teams options if needed."
      >
        <InitialAttendeePicker
          disabled={!hasFacilities || isPending}
          onSelectedCountChange={setSelectedAttendeeCount}
          onDraftChange={() => setIsDirty(true)}
        />

        <DepartmentPicker
          departments={departments}
          disabled={!hasFacilities || isPending}
          onSelectedCountChange={setSelectedDepartmentCount}
          onDraftChange={() => setIsDirty(true)}
        />

        <div className="grid gap-2 rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <Label htmlFor="teamsMeeting" className="flex items-start gap-3 font-medium">
            <Input
              id="teamsMeeting"
              name="teamsMeeting"
              type="checkbox"
              value="yes"
              checked={teamsMeeting}
              onChange={(event) => {
                setIsDirty(true);
                setTeamsMeeting(event.target.checked);
              }}
              className="mt-0.5 size-4"
              disabled={!hasFacilities || isPending}
            />
            <span>Make this a Teams meeting</span>
          </Label>
          <p className="qbook-type-meta pl-7">
            After confirmation, QBook sends one Outlook invitation to the
            internal attendees selected above. The join link is available only
            to the organiser and invited staff.
          </p>
        </div>

        {hasCompletePreview ? (
          <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
            <h3 className="qbook-type-section text-base">Booking summary</h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="qbook-type-meta">Facility</dt>
                <dd className="font-medium">
                  {selectedFacilityDetails
                    ? `${selectedFacilityDetails.name}, ${selectedFacilityDetails.level}`
                    : "Choose a facility"}
                </dd>
              </div>
              <div>
                <dt className="qbook-type-meta">Date</dt>
                <dd className="qbook-type-tabular font-medium">
                  {previewValues.date || "Choose a date"}
                </dd>
              </div>
              <div>
                <dt className="qbook-type-meta">Time</dt>
                <dd className="qbook-type-tabular font-medium">
                  {previewValues.startTime || "Start"} -{" "}
                  {previewValues.endTime || "End"}
                </dd>
              </div>
              <div>
                <dt className="qbook-type-meta">Purpose</dt>
                <dd className="font-medium">
                  {previewValues.title || "Enter a purpose"}
                </dd>
              </div>
              {previewValues.attendeeCount ? (
                <div>
                  <dt className="qbook-type-meta">Attendees</dt>
                  <dd className="qbook-type-tabular font-medium">
                    {previewValues.attendeeCount}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="qbook-type-meta">Food and drinks</dt>
                <dd className="font-medium">
                  {cateringRequired
                    ? drinkRequests.length + foodRequests.length > 0
                      ? "Requested"
                      : "Select requests"
                    : "Not requested"}
                </dd>
              </div>
              <div>
                <dt className="qbook-type-meta">Internal attendees</dt>
                <dd className="font-medium">
                  {selectedAttendeeCount > 0
                    ? `${selectedAttendeeCount} selected`
                    : "None selected"}
                </dd>
              </div>
              <div>
                <dt className="qbook-type-meta">Departments</dt>
                <dd className="font-medium">
                  {selectedDepartmentCount > 0
                    ? `${selectedDepartmentCount} selected`
                    : "None selected"}
                </dd>
              </div>
              <div>
                <dt className="qbook-type-meta">Meeting type</dt>
                <dd className="font-medium">
                  {teamsMeeting ? "Teams meeting" : "Room only"}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </BookingFormSection>

      <BookingStickyActions>
        <Link
          href="/facilities"
          className={buttonVariants({ variant: "ghost" })}
          onClick={(event) => {
            if (
              isDirty &&
              !window.confirm(
                "Discard your booking draft and return to facilities?",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          {isDirty ? "Discard and return" : "Back to facilities"}
        </Link>
        <Button type="submit" disabled={!hasFacilities || isPending}>
          <PendingButtonContent
            pending={isPending}
            pendingLabel={
              approvalRequired
                ? "Submitting booking request..."
                : "Creating booking..."
            }
          >
            {approvalRequired ? "Submit booking request" : "Create booking"}
          </PendingButtonContent>
        </Button>
      </BookingStickyActions>
    </form>
  );
}
