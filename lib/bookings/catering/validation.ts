import { z } from "zod";

import {
  cateringServingTimeOptions,
  cateringTypeOptions,
  type BookingCateringDetails,
} from "@/lib/bookings/catering/format";

export const cateringRequiredValues = ["yes", "no"] as const;

export const cateringFormSchema = z
  .object({
    cateringRequired: z.enum(cateringRequiredValues),
    cateringType: z
      .union([z.enum(cateringTypeOptions), z.literal("")])
      .optional(),
    cateringPax: z
      .union([
        z.literal(""),
        z.coerce
          .number()
          .int("Number of pax must be a whole number.")
          .min(1, "Number of pax must be greater than zero.")
          .max(100000, "Number of pax is too large."),
      ])
      .optional(),
    cateringServingTime: z
      .union([z.enum(cateringServingTimeOptions), z.literal("")])
      .optional(),
    cateringDietaryNotes: z
      .string()
      .trim()
      .max(1000, "Dietary notes must be 1000 characters or less.")
      .optional(),
    cateringNotes: z
      .string()
      .trim()
      .max(1500, "Catering notes must be 1500 characters or less.")
      .optional(),
  })
  .superRefine((values, context) => {
    if (values.cateringRequired !== "yes") {
      return;
    }

    if (!values.cateringType) {
      context.addIssue({
        code: "custom",
        path: ["cateringType"],
        message: "Choose the food or drinks request type.",
      });
    }

    if (!values.cateringPax) {
      context.addIssue({
        code: "custom",
        path: ["cateringPax"],
        message: "Enter the number of pax for catering.",
      });
    }

    if (!values.cateringServingTime) {
      context.addIssue({
        code: "custom",
        path: ["cateringServingTime"],
        message: "Choose when the food or drinks should be served.",
      });
    }
  });

export type CateringFormValues = z.infer<typeof cateringFormSchema>;

export function formDataToCateringValues(formData: FormData) {
  const getValue = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  return {
    cateringRequired: getValue("cateringRequired") === "yes" ? "yes" : "no",
    cateringType: getValue("cateringType"),
    cateringPax: getValue("cateringPax"),
    cateringServingTime: getValue("cateringServingTime"),
    cateringDietaryNotes: getValue("cateringDietaryNotes"),
    cateringNotes: getValue("cateringNotes"),
  };
}

export function cateringValuesToDetails(
  values: CateringFormValues,
): BookingCateringDetails {
  if (values.cateringRequired !== "yes") {
    return {
      required: false,
      type: null,
      pax: null,
      servingTime: null,
      dietaryNotes: null,
      notes: null,
    };
  }

  return {
    required: true,
    type: values.cateringType || null,
    pax:
      values.cateringPax === "" || values.cateringPax === undefined
        ? null
        : values.cateringPax,
    servingTime: values.cateringServingTime || null,
    dietaryNotes: values.cateringDietaryNotes?.trim() || null,
    notes: values.cateringNotes?.trim() || null,
  };
}
