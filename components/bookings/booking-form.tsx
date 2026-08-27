"use client";

import type { FormEvent, ReactNode } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
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
import { employeeCopy } from "@/lib/employee/plain-language";
import {
  formatEffectiveApprovalLabel,
  formatBookingWindowLabel,
  getEffectiveApprovalRequired,
  type AppSettings,
} from "@/lib/settings/app-settings";
import { cn } from "@/lib/utils";
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
import { INTERNAL_INVITES_ENABLED } from "@/lib/bookings/invitations/feature";
import { DepartmentPicker } from "@/components/bookings/department-picker";
import { FieldRequirementBadge } from "@/components/shared/field-requirement-badge";
import {
  BookingFormSection,
  BookingStickyActions,
  BookingWizardNav,
  type BookingWizardStepItem,
} from "@/components/bookings/booking-form-section";

const initialState: BookingActionResult = {
  status: "idle",
  message: "",
};

const WIZARD_STEP_LABELS = [
  employeeCopy.pickARoom,
  employeeCopy.pickDateAndTime,
  employeeCopy.meetingDetails,
  employeeCopy.peopleAndExtras,
  employeeCopy.reviewAndSend,
] as const;

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
  | "cateringDietaryNotes";

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
      title: "That time is taken",
      message:
        "This room is already booked for that time. Please choose another time or room.",
    };
  }

  if (message.includes("blocked")) {
    return {
      title: "Room unavailable",
      message: "This room is unavailable during the selected time.",
    };
  }

  if (message.includes("maintenance")) {
    return {
      title: "Room under maintenance",
      message: "This room is under maintenance during the selected time.",
    };
  }

  return {
    title: "Booking unavailable",
    message: state.message,
  };
}

const TOTAL_STEPS = 5;

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
  const [wizardStep, setWizardStep] = useState(1);
  const [submitUnlocked, setSubmitUnlocked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
  const [cateringRequired, setCateringRequired] = useState(false);
  const [cateringPax, setCateringPax] = useState("");
  const [cateringServingTime, setCateringServingTime] = useState("");
  const [selectedDrinkItems, setSelectedDrinkItems] = useState<string[]>([]);
  const [selectedFoodItems, setSelectedFoodItems] = useState<string[]>([]);
  const [otherDrinkRequest, setOtherDrinkRequest] = useState("");
  const [otherFoodRequest, setOtherFoodRequest] = useState("");
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
    const nextAttendeeCount = getValue("attendeeCount");
    setPreviewValues({
      date: getValue("date"),
      startTime: getValue("startTime"),
      endTime: getValue("endTime"),
      title: getValue("title"),
      attendeeCount: nextAttendeeCount,
    });
    if (nextAttendeeCount.trim()) {
      setCateringPax(nextAttendeeCount.trim());
    }
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
    if (key === "attendeeCount") {
      const next = String(value).trim();
      if (next) {
        setCateringPax(next);
      }
    }
  }

  function capacityErrorForAttendeeCount(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed || !selectedFacilityDetails) return undefined;
    const count = Number(trimmed);
    if (!Number.isFinite(count)) return undefined;
    if (count > selectedFacilityDetails.capacity) {
      return `How many people should not exceed this room’s limit of ${selectedFacilityDetails.capacity}.`;
    }
    return undefined;
  }

  function getStepErrors(step: number): BookingFieldErrors {
    const nextErrors: BookingFieldErrors = {};

    if (step === 1 && !selectedFacility) {
      nextErrors.facilityId = "Choose a room to continue.";
    }

    if (step === 2) {
      if (!previewValues.date) nextErrors.date = "Choose a date.";
      if (!previewValues.startTime) nextErrors.startTime = "Choose a start time.";
      if (!previewValues.endTime) nextErrors.endTime = "Choose an end time.";
    }

    if (step === 3) {
      if (!previewValues.title.trim()) {
        nextErrors.title = "Enter a short name for this meeting.";
      }
      const capacityMessage = capacityErrorForAttendeeCount(
        previewValues.attendeeCount,
      );
      if (capacityMessage) {
        nextErrors.attendeeCount = capacityMessage;
      }
    }

    if (step === 4 && cateringRequired) {
      if (!derivedCateringType) {
        nextErrors.cateringType = "Choose at least one food or drink item.";
      }
      if (!cateringPax.trim()) {
        nextErrors.cateringPax = "Enter the number of people for catering.";
      }
      if (!cateringServingTime) {
        nextErrors.cateringServingTime =
          "Choose when the food or drinks should be served.";
      }
    }

    return nextErrors;
  }

  function stepHasError(step: number, errors: BookingFieldErrors) {
    if (step === 1) return Boolean(errors.facilityId);
    if (step === 2) {
      return Boolean(errors.date || errors.startTime || errors.endTime);
    }
    if (step === 3) {
      return Boolean(
        errors.title || errors.description || errors.attendeeCount,
      );
    }
    if (step === 4) {
      return Boolean(
        errors.cateringType ||
          errors.cateringPax ||
          errors.cateringServingTime ||
          errors.cateringDietaryNotes,
      );
    }
    return false;
  }

  function firstInvalidStep(errors: BookingFieldErrors) {
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      if (stepHasError(step, errors)) return step;
    }
    return TOTAL_STEPS;
  }

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    if (!submitUnlocked) {
      event.preventDefault();
      return;
    }

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

      const capacityMessage = capacityErrorForAttendeeCount(
        previewValues.attendeeCount,
      );
      if (capacityMessage) {
        nextErrors.attendeeCount = capacityMessage;
      }
    }

    if (Object.values(nextErrors).some(Boolean)) {
      event.preventDefault();
      setFieldErrors(nextErrors);
      showFormValidationError(nextErrors);
      goToStep(firstInvalidStep(nextErrors), { scroll: false });
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

  function goToStep(next: number, options?: { scroll?: boolean }) {
    const clamped = Math.min(TOTAL_STEPS, Math.max(1, next));
    setWizardStep(clamped);
    if (options?.scroll === false) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (wizardStep !== TOTAL_STEPS && submitUnlocked) {
    setSubmitUnlocked(false);
  }

  // Brief lock so a double-tap on Continue cannot immediately submit Confirm.
  useEffect(() => {
    if (wizardStep !== TOTAL_STEPS) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSubmitUnlocked(true);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [wizardStep]);

  function validateCurrentStep(): boolean {
    const nextErrors = getStepErrors(wizardStep);

    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      showFormValidationError(nextErrors);
      return false;
    }

    setFieldErrors((current) => {
      const cleared = { ...current };
      for (const key of Object.keys(nextErrors) as BookingFieldId[]) {
        delete cleared[key];
      }
      // Clear known fields for this step even when valid
      if (wizardStep === 1) delete cleared.facilityId;
      if (wizardStep === 2) {
        delete cleared.date;
        delete cleared.startTime;
        delete cleared.endTime;
      }
      if (wizardStep === 3) {
        delete cleared.title;
        delete cleared.attendeeCount;
      }
      if (wizardStep === 4) {
        delete cleared.cateringType;
        delete cleared.cateringPax;
        delete cleared.cateringServingTime;
      }
      return cleared;
    });

    return true;
  }

  function handleContinue() {
    if (!validateCurrentStep()) return;
    goToStep(wizardStep + 1);
  }

  function handleStepSelect(target: number) {
    if (target === wizardStep) return;

    if (target < wizardStep) {
      goToStep(target);
      return;
    }

    for (let step = wizardStep; step < target; step += 1) {
      const nextErrors = getStepErrors(step);
      if (Object.values(nextErrors).some(Boolean)) {
        setFieldErrors((current) => ({ ...current, ...nextErrors }));
        showFormValidationError(nextErrors);
        goToStep(step, { scroll: false });
        return;
      }
    }

    goToStep(target);
  }

  const wizardNavSteps: BookingWizardStepItem[] = WIZARD_STEP_LABELS.map(
    (label, index) => {
      const step = index + 1;
      const hasAttemptedErrors = stepHasError(step, fieldErrors);

      let status: BookingWizardStepItem["status"];
      if (step === wizardStep) {
        status = hasAttemptedErrors ? "error" : "current";
      } else if (hasAttemptedErrors) {
        status = "error";
      } else if (step < wizardStep) {
        status = "complete";
      } else {
        status = "upcoming";
      }

      return { step, label, status };
    },
  );

  return (
    <form
      action={formAction}
      className="qbook-reveal grid gap-0 pb-24"
      noValidate
      onChange={(event) => updatePreview(event.currentTarget)}
      onSubmit={(event) => {
        if (wizardStep !== TOTAL_STEPS) {
          event.preventDefault();
          handleContinue();
          return;
        }
        validateBeforeSubmit(event);
      }}
    >
      <OverlayLoader show={isPending} label={employeeCopy.sending} />

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
          <AlertTitle>No rooms available</AlertTitle>
          <AlertDescription>
            There are no active rooms available for booking. Contact an
            administrator if this looks wrong.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <BookingWizardNav steps={wizardNavSteps} onSelect={handleStepSelect} />

        <div className="min-w-0">
      <BookingFormSection
        step={1}
        totalSteps={TOTAL_STEPS}
        title={employeeCopy.pickARoom}
        description="Tap the room you want. You can change this later."
        hidden={wizardStep !== 1}
      >
        <div className="grid gap-2">
          <BookingFieldLabel htmlFor="facility-picker" required>
            {employeeCopy.room}
          </BookingFieldLabel>
          <input type="hidden" id="facility-picker" name="facilityId" value={selectedFacility} />
          <FormFieldError id="facilityId-error">
            {fieldErrors.facilityId}
          </FormFieldError>
        </div>

        <div
          id="facilityId"
          className="grid gap-3 sm:grid-cols-2"
          role="listbox"
          tabIndex={-1}
          aria-label="Choose a room"
        >
          {facilities.map((facility, index) => {
            const selected = facility.id === selectedFacility;
            return (
              <button
                key={facility.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={!hasFacilities || isPending}
                onClick={() => {
                  setIsDirty(true);
                  setSelectedFacility(facility.id);
                  setFieldErrors((current) => ({ ...current, facilityId: undefined }));
                }}
                className={cn(
                  "grid min-h-28 gap-3 rounded-xl border p-3 text-left transition-[border-color,box-shadow,background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-[0.99] sm:grid-cols-[112px_minmax(0,1fr)]",
                  selected
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/40"
                    : "border-border/80 bg-card hover:border-primary/40 hover:bg-accent/40",
                )}
              >
                <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                  <FacilityPhoto
                    facility={facility}
                    priority={index < 2}
                    className="aspect-[4/3] min-h-24"
                  />
                </div>
                <div className="grid gap-1 self-center">
                  <p className="font-semibold leading-tight">{facility.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {facility.level} · {formatFacilityType(facility.type)}
                  </p>
                  <p className="text-sm font-medium">
                    {employeeCopy.fitsPeople(facility.capacity)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedFacilityDetails ? (
          <aside className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="qbook-type-meta">Selected room</p>
                <p className="qbook-type-section mt-0.5">
                  {selectedFacilityDetails.name}
                </p>
                <p className="qbook-type-meta mt-1">
                  {selectedFacilityDetails.level} ·{" "}
                  {formatFacilityType(selectedFacilityDetails.type)}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                <span className="qbook-type-tabular text-sm">
                  {employeeCopy.fitsPeople(selectedFacilityDetails.capacity)}
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
          </aside>
        ) : null}
      </BookingFormSection>

      <BookingFormSection
        step={2}
        totalSteps={TOTAL_STEPS}
        title={employeeCopy.pickDateAndTime}
        description="Pick a date, then drag or tap an open time on the timeline."
        hidden={wizardStep !== 2}
      >
        {selectedFacilityDetails ? (
          <p className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm">
            Room: <span className="font-medium">{selectedFacilityDetails.name}</span>
            {" · "}
            {selectedFacilityDetails.level}
          </p>
        ) : null}
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
        totalSteps={TOTAL_STEPS}
        title={employeeCopy.meetingDetails}
        description="Tell us what the meeting is for."
        hidden={wizardStep !== 3}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <BookingFieldLabel htmlFor="title" required>
              Meeting name
            </BookingFieldLabel>
            <Input
              id="title"
              name="title"
              maxLength={160}
              placeholder="Example: Weekly team sync"
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

          <div className="grid gap-2 sm:col-span-2">
            <BookingFieldLabel htmlFor="description" required={false}>
              Description
            </BookingFieldLabel>
            <Textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Optional notes for yourself or the room admin"
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

          <div className="grid gap-2">
            <BookingFieldLabel htmlFor="attendeeCount" required={false}>
              {employeeCopy.howManyPeople}
            </BookingFieldLabel>
            <Input
              id="attendeeCount"
              name="attendeeCount"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={
                selectedFacilityDetails
                  ? `Optional (up to ${selectedFacilityDetails.capacity})`
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
        </div>
      </BookingFormSection>

      <BookingFormSection
        step={4}
        totalSteps={TOTAL_STEPS}
        title={employeeCopy.peopleAndExtras}
        description={
          INTERNAL_INVITES_ENABLED
            ? "Invite coworkers, add food or drinks, or skip this step."
            : "Add departments, food or drinks, or skip this step."
        }
        hidden={wizardStep !== 4}
      >
        {INTERNAL_INVITES_ENABLED ? (
          <InitialAttendeePicker
            disabled={!hasFacilities || isPending}
            onSelectedCountChange={setSelectedAttendeeCount}
            onDraftChange={() => setIsDirty(true)}
          />
        ) : null}

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
            <span>Also create a Teams meeting link</span>
          </Label>
          <p className="qbook-type-meta pl-7">
            After confirmation, invited staff get one Outlook invitation with
            the join link.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="cateringRequired" className="inline-flex items-center gap-2">
                <Coffee className="size-4 text-muted-foreground" aria-hidden="true" />
                {employeeCopy.needFoodOrDrinks}
              </Label>
              <FieldRequirementBadge required={false} />
            </div>
            <Select
              id="cateringRequired"
              name="cateringRequired"
              defaultValue="no"
              onChange={(event) => {
                const enabled = event.target.value === "yes";
                setCateringRequired(enabled);
                setIsDirty(true);
                if (enabled && previewValues.attendeeCount.trim()) {
                  setCateringPax(previewValues.attendeeCount.trim());
                }
              }}
              disabled={!hasFacilities || isPending}
            >
              <option value="no">No</option>
              <option value="yes">Yes — show options</option>
            </Select>
          </div>

          {cateringRequired ? (
            <>
              <input
                type="hidden"
                name="cateringType"
                value={derivedCateringType}
              />

              <div
                id="cateringType"
                tabIndex={-1}
                className="grid gap-4 sm:col-span-2 lg:grid-cols-2"
              >
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
                          className="flex min-h-11 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
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
                          className="flex min-h-11 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
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
                  {employeeCopy.numberOfPeople}
                </BookingFieldLabel>
                <Input
                  id="cateringPax"
                  name="cateringPax"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={cateringPax}
                  onChange={(event) => {
                    setIsDirty(true);
                    setCateringPax(event.target.value);
                  }}
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
                  value={cateringServingTime}
                  onChange={(event) => {
                    setIsDirty(true);
                    setCateringServingTime(event.target.value);
                  }}
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
                  placeholder="Vegetarian, allergies, or other needs"
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

              <input
                type="hidden"
                name="cateringNotes"
                value={combinedCateringNotes}
              />
            </>
          ) : null}
        </div>
      </BookingFormSection>

      <BookingFormSection
        step={5}
        totalSteps={TOTAL_STEPS}
        title={employeeCopy.reviewAndSend}
        description="Check the details, then send your booking."
        hidden={wizardStep !== 5}
      >
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="qbook-type-section text-base">Booking summary</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="qbook-type-meta">{employeeCopy.room}</dt>
              <dd className="font-medium">
                {selectedFacilityDetails
                  ? `${selectedFacilityDetails.name}, ${selectedFacilityDetails.level}`
                  : "Choose a room"}
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
                {previewValues.startTime || "Start"} –{" "}
                {previewValues.endTime || "End"}
              </dd>
            </div>
            <div>
              <dt className="qbook-type-meta">Meeting name</dt>
              <dd className="font-medium">
                {previewValues.title || "Enter a meeting name"}
              </dd>
            </div>
            {previewValues.attendeeCount ? (
              <div>
                <dt className="qbook-type-meta">{employeeCopy.howManyPeople}</dt>
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
            {INTERNAL_INVITES_ENABLED ? (
              <div>
                <dt className="qbook-type-meta">Invited staff</dt>
                <dd className="font-medium">
                  {selectedAttendeeCount > 0
                    ? `${selectedAttendeeCount} selected`
                    : "None selected"}
                </dd>
              </div>
            ) : null}
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
          {approvalRequired ? (
            <p className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              This room needs approval. After you send, an admin will review it.
            </p>
          ) : null}
        </div>
      </BookingFormSection>

      <BookingStickyActions>
        {wizardStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11"
            onClick={() => goToStep(wizardStep - 1)}
            disabled={isPending}
          >
            {employeeCopy.back}
          </Button>
        ) : (
          <Link
            href="/facilities"
            className={buttonVariants({ variant: "ghost", size: "lg" })}
            onClick={(event) => {
              if (
                isDirty &&
                !window.confirm(
                  "Discard your booking draft and return to rooms?",
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            {isDirty ? "Discard and return" : `Back to ${employeeCopy.rooms.toLowerCase()}`}
          </Link>
        )}
        {wizardStep < TOTAL_STEPS ? (
          <Button
            type="button"
            size="lg"
            className="min-h-11"
            disabled={!hasFacilities || isPending}
            onClick={handleContinue}
          >
            {employeeCopy.continue}
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            className="min-h-11"
            disabled={!hasFacilities || isPending || !submitUnlocked}
            aria-busy={isPending || !submitUnlocked}
          >
            <PendingButtonContent
              pending={isPending || !submitUnlocked}
              pendingLabel={
                isPending ? employeeCopy.sending : "Please wait..."
              }
            >
              {approvalRequired ? "Send for approval" : "Confirm booking"}
            </PendingButtonContent>
          </Button>
        )}
      </BookingStickyActions>
        </div>
      </div>
    </form>
  );
}
