"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  updateBookingAction,
  type BookingActionResult,
} from "@/lib/bookings/actions";
import {
  bookingFormSchema,
  formDataToBookingValues,
  getBookingDateRange,
  validateBookingTimeWithinWindow,
} from "@/lib/bookings/validation";
import { getZonedBookingFormDateTime } from "@/lib/bookings/form-datetime";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import type { Facility } from "@/lib/facilities/queries";
import { formatFacilityType } from "@/lib/facilities/format";
import type { AppSettings } from "@/lib/settings/app-settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: BookingActionResult = {
  status: "idle",
  message: "",
};

type BookingEditFieldId =
  | "facilityId"
  | "date"
  | "startTime"
  | "endTime"
  | "title"
  | "description"
  | "attendeeCount";

type BookingEditFieldErrors = Partial<Record<BookingEditFieldId, string>>;

function getFirstError(error?: string[]) {
  return error?.[0];
}

export function BookingEditForm({
  booking,
  facilities,
  settings,
}: {
  booking: EmployeeBooking;
  facilities: Facility[];
  settings: AppSettings;
}) {
  const [state, formAction, isPending] = useActionState(
    updateBookingAction.bind(null, booking.id),
    initialState,
  );
  const start = getZonedBookingFormDateTime(
    booking.startsAt,
    settings.defaultTimezone,
  );
  const end = getZonedBookingFormDateTime(
    booking.endsAt,
    settings.defaultTimezone,
  );
  const [selectedFacility, setSelectedFacility] = useState(booking.facilityId);
  const [fieldErrors, setFieldErrors] = useState<BookingEditFieldErrors>({});
  const selectedFacilityDetails = facilities.find(
    (facility) => facility.id === selectedFacility,
  );

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    formData.set("cateringRequired", "no");
    const parsed = bookingFormSchema.safeParse(formDataToBookingValues(formData));
    const nextErrors: BookingEditFieldErrors = {};

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
      const range = getBookingDateRange(parsed.data, settings.defaultTimezone);
      if (range.message) {
        nextErrors.endTime = range.message;
      }

      const windowMessage = validateBookingTimeWithinWindow(
        parsed.data,
        settings,
      );

      if (windowMessage) {
        nextErrors.endTime = windowMessage;
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
      onSubmit={validateBeforeSubmit}
    >
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          {state.status === "error" ? (
            <AlertCircle aria-hidden="true" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
          <AlertTitle>
            {state.status === "error" ? "Booking not updated" : "Booking updated"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <input type="hidden" name="cateringRequired" value="no" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="facilityId">Facility</Label>
          <select
            id="facilityId"
            name="facilityId"
            value={selectedFacility}
            onChange={(event) => setSelectedFacility(event.target.value)}
            disabled={isPending}
            aria-describedby={getFieldDescribedBy(
              "facilityId-helper",
              fieldErrors.facilityId && "facilityId-error",
            )}
            aria-invalid={Boolean(fieldErrors.facilityId)}
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
            Changing the facility re-checks availability before saving.
          </FormFieldHelper>
          <FormFieldError id="facilityId-error">
            {fieldErrors.facilityId}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={start.date}
            disabled={isPending}
            aria-describedby={getFieldDescribedBy(
              "date-helper",
              fieldErrors.date && "date-error",
            )}
            aria-invalid={Boolean(fieldErrors.date)}
            required
          />
          <FormFieldHelper id="date-helper">
            Times use {settings.defaultTimezone}.
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
            defaultValue={booking.attendeeCount ?? ""}
            disabled={isPending}
            aria-describedby={getFieldDescribedBy(
              "attendeeCount-helper",
              fieldErrors.attendeeCount && "attendeeCount-error",
            )}
            aria-invalid={Boolean(fieldErrors.attendeeCount)}
          />
          <FormFieldHelper id="attendeeCount-helper">
            {selectedFacilityDetails
              ? `Keep within capacity ${selectedFacilityDetails.capacity}.`
              : "Keep within facility capacity."}
          </FormFieldHelper>
          <FormFieldError id="attendeeCount-error">
            {fieldErrors.attendeeCount}
          </FormFieldError>
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
                min={settings.bookingWindowStart}
                max={settings.bookingWindowEnd}
                defaultValue={start.time}
                disabled={isPending}
                aria-describedby={getFieldDescribedBy(
                  fieldErrors.startTime && "startTime-error",
                )}
                aria-invalid={Boolean(fieldErrors.startTime)}
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
                min={settings.bookingWindowStart}
                max={settings.bookingWindowEnd}
                defaultValue={end.time}
                disabled={isPending}
                aria-describedby={getFieldDescribedBy(
                  fieldErrors.endTime && "endTime-error",
                )}
                aria-invalid={Boolean(fieldErrors.endTime)}
                required
              />
            </div>
          </div>
          <FormFieldError id="startTime-error">
            {fieldErrors.startTime}
          </FormFieldError>
          <FormFieldError id="endTime-error">
            {fieldErrors.endTime}
          </FormFieldError>
        </fieldset>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="title">Purpose</Label>
          <Input
            id="title"
            name="title"
            maxLength={160}
            defaultValue={booking.title}
            disabled={isPending}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.title && "title-error",
            )}
            aria-invalid={Boolean(fieldErrors.title)}
            required
          />
          <FormFieldError id="title-error">{fieldErrors.title}</FormFieldError>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={booking.description ?? ""}
          disabled={isPending}
          aria-describedby={getFieldDescribedBy(
            "description-helper",
            fieldErrors.description && "description-error",
          )}
          aria-invalid={Boolean(fieldErrors.description)}
          className="min-h-28 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
        />
        <FormFieldHelper id="description-helper">
          Catering details are edited separately from the booking detail page.
        </FormFieldHelper>
        <FormFieldError id="description-error">
          {fieldErrors.description}
        </FormFieldError>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <Link
          href={`/bookings/${booking.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to booking
        </Link>
        <Button type="submit" disabled={isPending}>
          <PendingButtonContent pending={isPending} pendingLabel="Saving...">
            Save changes
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
