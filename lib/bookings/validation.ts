import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const bookingFormSchema = z.object({
  facilityId: z.string().uuid("Choose a facility."),
  date: z.string().min(1, "Choose a date."),
  startTime: z.string().regex(timePattern, "Choose a valid start time."),
  endTime: z.string().regex(timePattern, "Choose a valid end time."),
  title: z.string().trim().min(2, "Enter a booking purpose.").max(160),
  description: z.string().trim().max(2000).optional(),
  attendeeCount: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int("Attendee count must be a whole number.")
        .min(0, "Attendee count cannot be negative.")
        .max(100000, "Attendee count is too large."),
    ])
    .optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const cancellationFormSchema = z.object({
  reason: z.string().trim().max(1000, "Reason must be 1000 characters or less.").optional(),
});

export type CancellationFormValues = z.infer<typeof cancellationFormSchema>;

export function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

export function formDataToBookingValues(formData: FormData) {
  return {
    facilityId: getOptionalFormValue(formData, "facilityId"),
    date: getOptionalFormValue(formData, "date"),
    startTime: getOptionalFormValue(formData, "startTime"),
    endTime: getOptionalFormValue(formData, "endTime"),
    title: getOptionalFormValue(formData, "title"),
    description: getOptionalFormValue(formData, "description"),
    attendeeCount: getOptionalFormValue(formData, "attendeeCount"),
  };
}

export function formDataToCancellationValues(formData: FormData) {
  return {
    reason: getOptionalFormValue(formData, "reason"),
  };
}

export function normalizeAttendeeCount(
  attendeeCount: BookingFormValues["attendeeCount"],
) {
  return attendeeCount === "" || attendeeCount === undefined
    ? null
    : attendeeCount;
}

export function getBookingDateRange(values: Pick<
  BookingFormValues,
  "date" | "startTime" | "endTime"
>) {
  // Phase 6 stores form times in the app timezone. Malaysia has no DST, so +08:00
  // keeps local booking form values stable even if the server runs in UTC.
  const startsAt = new Date(`${values.date}T${values.startTime}:00+08:00`);
  const endsAt = new Date(`${values.date}T${values.endTime}:00+08:00`);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return {
      startsAt: null,
      endsAt: null,
      message: "Choose a valid booking date and time.",
    };
  }

  if (startsAt >= endsAt) {
    return {
      startsAt,
      endsAt,
      message: "Start time must be before end time.",
    };
  }

  return {
    startsAt,
    endsAt,
    message: null,
  };
}
