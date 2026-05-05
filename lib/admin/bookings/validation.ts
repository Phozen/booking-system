import { z } from "zod";

export const adminBookingStatusOptions = [
  "all",
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
  "expired",
] as const;

export const adminBookingActionSchema = z.object({
  remarks: z.string().trim().max(1000, "Remarks must be 1000 characters or less.").optional(),
});

export type AdminBookingActionValues = z.infer<typeof adminBookingActionSchema>;

export function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

export function formDataToAdminBookingActionValues(formData: FormData) {
  return {
    remarks: getOptionalFormValue(formData, "remarks"),
  };
}
