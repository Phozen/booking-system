import { z } from "zod";

import {
  getFormDateTimeIso,
  getOptionalAdminFormValue,
} from "@/lib/admin/blocked-periods/validation";

export const maintenanceStatusOptions = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type MaintenanceStatus = (typeof maintenanceStatusOptions)[number];

const timeInputSchema = z.string().regex(/^\d{2}:\d{2}$/);
const dateInputSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const maintenanceClosureFormSchema = z
  .object({
    facilityId: z.string().uuid(),
    title: z.string().trim().min(2).max(160),
    reason: z.string().trim().max(1000).optional(),
    startDate: dateInputSchema,
    startTime: timeInputSchema,
    endDate: dateInputSchema,
    endTime: timeInputSchema,
    status: z.enum(maintenanceStatusOptions).default("scheduled"),
  })
  .superRefine((value, context) => {
    const startsAt = getFormDateTimeIso(value.startDate, value.startTime);
    const endsAt = getFormDateTimeIso(value.endDate, value.endTime);

    if (!startsAt || !endsAt || startsAt >= endsAt) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time.",
      });
    }
  });

export type MaintenanceClosureFormValues = z.infer<
  typeof maintenanceClosureFormSchema
>;

export function formDataToMaintenanceClosureValues(formData: FormData) {
  return {
    facilityId: getOptionalAdminFormValue(formData, "facilityId"),
    title: getOptionalAdminFormValue(formData, "title"),
    reason: getOptionalAdminFormValue(formData, "reason"),
    startDate: getOptionalAdminFormValue(formData, "startDate"),
    startTime: getOptionalAdminFormValue(formData, "startTime"),
    endDate: getOptionalAdminFormValue(formData, "endDate"),
    endTime: getOptionalAdminFormValue(formData, "endTime"),
    status: getOptionalAdminFormValue(formData, "status") || "scheduled",
  };
}

export function formatMaintenanceStatus(status: MaintenanceStatus) {
  const labels: Record<MaintenanceStatus, string> = {
    scheduled: "Scheduled",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status];
}
