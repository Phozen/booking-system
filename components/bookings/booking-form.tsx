"use client";

import type { FormEvent } from "react";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarClock, CheckCircle2, ShieldCheck, Users } from "lucide-react";

import {
  createBookingAction,
  type BookingActionResult,
} from "@/lib/bookings/actions";
import {
  bookingFormSchema,
  formDataToBookingValues,
  getBookingDateRange,
} from "@/lib/bookings/validation";
import type { Facility } from "@/lib/facilities/queries";
import {
  formatFacilityType,
} from "@/lib/facilities/format";
import {
  formatEffectiveApprovalCopy,
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

const initialState: BookingActionResult = {
  status: "idle",
  message: "",
};

type BookingFieldId =
  | "facilityId"
  | "date"
  | "startTime"
  | "endTime"
  | "title"
  | "description"
  | "attendeeCount";

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
  settings,
}: {
  facilities: Facility[];
  selectedFacilityId?: string;
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
  const [previewValues, setPreviewValues] = useState<BookingPreviewValues>({
    date: "",
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
  const hasPreviewDetails = Boolean(
    selectedFacilityDetails ||
      previewValues.date ||
      previewValues.startTime ||
      previewValues.endTime ||
      previewValues.title ||
      previewValues.attendeeCount,
  );

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

  return (
    <form
      action={formAction}
      className="grid gap-5"
      noValidate
      onChange={(event) => updatePreview(event.currentTarget)}
      onSubmit={validateBeforeSubmit}
    >
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
            There are no active facilities available for booking.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
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
            Choose an active facility. Approval requirements depend on system
            and facility settings.
          </FormFieldHelper>
          <FormFieldError id="facilityId-error">
            {fieldErrors.facilityId}
          </FormFieldError>
        </div>

        {selectedFacilityDetails ? (
          <aside className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm sm:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Selected facility
                </p>
                <h2 className="mt-1 font-semibold tracking-normal">
                  {selectedFacilityDetails.name}
                </h2>
                <p className="mt-1 text-muted-foreground">
                  {selectedFacilityDetails.level} -{" "}
                  {formatFacilityType(selectedFacilityDetails.type)}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                Capacity {selectedFacilityDetails.capacity}
              </div>
            </div>
            <div className="inline-flex items-start gap-2 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4" aria-hidden="true" />
              <span>
                {formatEffectiveApprovalLabel(
                  selectedFacilityDetails.requiresApproval,
                  settings,
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatEffectiveApprovalCopy(
                selectedFacilityDetails.requiresApproval,
                settings,
              )}
            </p>
          </aside>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            disabled={!hasFacilities || isPending}
            aria-describedby={getFieldDescribedBy(
              "date-helper",
              fieldErrors.date && "date-error",
            )}
            aria-invalid={Boolean(fieldErrors.date)}
            required
          />
          <FormFieldHelper id="date-helper">
            Booking times use {settings.defaultTimezone}.
          </FormFieldHelper>
          <FormFieldError id="date-error">{fieldErrors.date}</FormFieldError>
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
            disabled={!hasFacilities || isPending}
            aria-describedby={getFieldDescribedBy(
              "attendeeCount-helper",
              fieldErrors.attendeeCount && "attendeeCount-error",
            )}
            aria-invalid={Boolean(fieldErrors.attendeeCount)}
          />
          <FormFieldHelper id="attendeeCount-helper">
            Optional. Keep within{" "}
            {selectedFacilityDetails
              ? `${selectedFacilityDetails.capacity} people for this facility`
              : "the facility capacity"}
            .
          </FormFieldHelper>
          <FormFieldError id="attendeeCount-error">
            {fieldErrors.attendeeCount}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            disabled={!hasFacilities || isPending}
            aria-describedby={getFieldDescribedBy(
              "startTime-helper",
              fieldErrors.startTime && "startTime-error",
            )}
            aria-invalid={Boolean(fieldErrors.startTime)}
            required
          />
          <FormFieldHelper id="startTime-helper">
            Back-to-back bookings are allowed. For example, 10:00-11:00 and
            11:00-12:00 do not conflict.
          </FormFieldHelper>
          <FormFieldError id="startTime-error">
            {fieldErrors.startTime}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endTime">End time</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            disabled={!hasFacilities || isPending}
            aria-describedby={getFieldDescribedBy(
              "endTime-helper",
              fieldErrors.endTime && "endTime-error",
            )}
            aria-invalid={Boolean(fieldErrors.endTime)}
            required
          />
          <FormFieldHelper id="endTime-helper">
            End time must be after the start time.
          </FormFieldHelper>
          <FormFieldError id="endTime-error">
            {fieldErrors.endTime}
          </FormFieldError>
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="title">Purpose</Label>
          <Input
            id="title"
            name="title"
            maxLength={160}
            disabled={!hasFacilities || isPending}
            aria-describedby={getFieldDescribedBy(
              "title-helper",
              fieldErrors.title && "title-error",
            )}
            aria-invalid={Boolean(fieldErrors.title)}
            required
          />
          <FormFieldHelper id="title-helper">
            Use a short purpose such as Team planning or Client presentation.
          </FormFieldHelper>
          <FormFieldError id="title-error">{fieldErrors.title}</FormFieldError>
        </div>
      </div>

      <div className="grid gap-2">
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
          Optional. Add setup notes or extra context for the booking.
        </FormFieldHelper>
        <FormFieldError id="description-error">
          {fieldErrors.description}
        </FormFieldError>
      </div>

      {hasPreviewDetails ? (
        <section className="grid gap-3 rounded-lg border bg-muted/40 p-4">
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

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <Link
          href="/facilities"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={!hasFacilities || isPending}>
          {isPending ? "Creating..." : "Create booking"}
        </Button>
      </div>
    </form>
  );
}
