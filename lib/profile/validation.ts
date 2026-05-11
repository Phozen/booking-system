import { z } from "zod";

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Enter your full name.")
    .max(160, "Full name must be 160 characters or fewer."),
  department: z
    .string()
    .trim()
    .max(120, "Department must be 120 characters or fewer.")
    .optional(),
  phone: z
    .string()
    .trim()
    .max(60, "Phone must be 60 characters or fewer.")
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export function formDataToProfileUpdateInput(formData: FormData) {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    department: String(formData.get("department") ?? "") || undefined,
    phone: String(formData.get("phone") ?? "") || undefined,
  };
}

export function buildProfileUpdatePayload(input: ProfileUpdateInput) {
  return {
    full_name: input.fullName,
    department: input.department || null,
    phone: input.phone || null,
  };
}

