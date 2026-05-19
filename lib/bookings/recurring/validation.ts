import { z } from "zod";

import {
  bookingFormSchema,
  formDataToBookingValues,
  getBookingDateRange,
} from "@/lib/bookings/validation";

export const recurrenceFormSchema = bookingFormSchema.and(
  z.object({
    frequency: z.enum(["daily", "weekly", "monthly"]),
    intervalCount: z.coerce
      .number()
      .int("Interval must be a whole number.")
      .min(1, "Interval must be at least 1.")
      .max(12, "Interval is too large for recurring booking v1."),
    endsOn: z.string().optional(),
    occurrenceCount: z.union([z.literal(""), z.coerce.number().int().min(1).max(50)]).optional(),
  }),
);

export type RecurrenceFormValues = z.infer<typeof recurrenceFormSchema>;

export function formDataToRecurrenceValues(formData: FormData) {
  return {
    ...formDataToBookingValues(formData),
    frequency: formData.get("frequency"),
    intervalCount: formData.get("intervalCount"),
    endsOn: formData.get("endsOn"),
    occurrenceCount: formData.get("occurrenceCount"),
  };
}

export function getOccurrenceDateRange(
  values: Pick<RecurrenceFormValues, "startTime" | "endTime"> & { date: string },
  timezone: string,
) {
  return getBookingDateRange(values, timezone);
}
