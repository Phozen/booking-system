import { z } from "zod";

export const facilityTypeOptions = ["meeting_room", "event_hall"] as const;
export const facilityStatusOptions = [
  "active",
  "inactive",
  "under_maintenance",
  "archived",
] as const;

export type FacilityType = (typeof facilityTypeOptions)[number];
export type FacilityStatus = (typeof facilityStatusOptions)[number];

export const facilityFormSchema = z.object({
  code: z.string().trim().min(2, "Enter a facility code.").max(40),
  name: z.string().trim().min(2, "Enter a facility name.").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a URL slug.")
    .max(140)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
  level: z.string().trim().min(2, "Enter the facility level.").max(80),
  type: z.enum(facilityTypeOptions),
  capacity: z.coerce
    .number()
    .int("Capacity must be a whole number.")
    .min(1, "Capacity must be at least 1.")
    .max(10000, "Capacity is too large."),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(facilityStatusOptions),
  requiresApproval: z.enum(["inherit", "required", "not_required"]),
  displayOrder: z.coerce.number().int().min(0).max(100000),
});

export type FacilityFormValues = z.infer<typeof facilityFormSchema>;

export function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  return value;
}

export function parseRequiresApproval(value: FacilityFormValues["requiresApproval"]) {
  if (value === "required") {
    return true;
  }

  if (value === "not_required") {
    return false;
  }

  return null;
}
