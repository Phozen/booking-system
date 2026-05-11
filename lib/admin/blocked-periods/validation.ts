import { z } from "zod";

import { zonedDateTimeToUtc } from "@/lib/calendar/date-range";

export const blockedPeriodScopeOptions = [
  "all_facilities",
  "selected_facilities",
] as const;

export type BlockedPeriodScope = (typeof blockedPeriodScopeOptions)[number];

const timeInputSchema = z.string().regex(/^\d{2}:\d{2}$/);
const dateInputSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const blockedPeriodFormSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    reason: z.string().trim().max(1000).optional(),
    startDate: dateInputSchema,
    startTime: timeInputSchema,
    endDate: dateInputSchema,
    endTime: timeInputSchema,
    scope: z.enum(blockedPeriodScopeOptions),
    facilityIds: z.array(z.string().uuid()).default([]),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (
      value.scope === "selected_facilities" &&
      value.facilityIds.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["facilityIds"],
        message: "Select at least one facility.",
      });
    }

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

export type BlockedPeriodFormValues = z.infer<typeof blockedPeriodFormSchema>;

export function getOptionalAdminFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getFormDateTimeIso(date: string, time: string, timeZone?: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const parsed = zonedDateTimeToUtc(
    year,
    month,
    day,
    hour,
    minute,
    0,
    timeZone,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function formDataToBlockedPeriodValues(formData: FormData) {
  return {
    title: getOptionalAdminFormValue(formData, "title"),
    reason: getOptionalAdminFormValue(formData, "reason"),
    startDate: getOptionalAdminFormValue(formData, "startDate"),
    startTime: getOptionalAdminFormValue(formData, "startTime"),
    endDate: getOptionalAdminFormValue(formData, "endDate"),
    endTime: getOptionalAdminFormValue(formData, "endTime"),
    scope: getOptionalAdminFormValue(formData, "scope"),
    facilityIds: formData
      .getAll("facilityIds")
      .filter((value): value is string => typeof value === "string"),
    isActive: formData.get("isActive") === "on",
  };
}

export function formatBlockedPeriodScope(scope: BlockedPeriodScope) {
  return scope === "all_facilities" ? "All facilities" : "Selected facilities";
}
