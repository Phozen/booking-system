import { z } from "zod";

import { zonedDateTimeToUtc } from "@/lib/calendar/date-range";
import type { WaitlistStatus } from "@/lib/waitlist/format";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const waitlistRequestSchema = z.object({
  facilityId: z.string().uuid().optional().or(z.literal("")),
  date: z.string().min(1, "Choose a date."),
  startTime: z.string().regex(timePattern, "Choose a valid start time."),
  endTime: z.string().regex(timePattern, "Choose a valid end time."),
  attendeeCount: z
    .union([
      z.literal(""),
      z.coerce.number().int().min(0).max(100000),
    ])
    .optional(),
  title: z.string().trim().min(2, "Enter a purpose.").max(160),
  reason: z.string().trim().max(2000).optional(),
});

export const adminWaitlistUpdateSchema = z.object({
  status: z.enum(["open", "suggested_alternative", "closed", "cancelled"]),
  adminResponse: z.string().trim().max(2000).optional(),
});

export function formDataToWaitlistValues(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  return {
    facilityId: get("facilityId"),
    date: get("date"),
    startTime: get("startTime"),
    endTime: get("endTime"),
    attendeeCount: get("attendeeCount"),
    title: get("title"),
    reason: get("reason"),
  };
}

export function getWaitlistDateRange(
  values: Pick<z.infer<typeof waitlistRequestSchema>, "date" | "startTime" | "endTime">,
  timezone: string,
) {
  const [year, month, day] = values.date.split("-").map(Number);
  const [startHour, startMinute] = values.startTime.split(":").map(Number);
  const [endHour, endMinute] = values.endTime.split(":").map(Number);
  const startsAt = zonedDateTimeToUtc(
    year,
    month,
    day,
    startHour,
    startMinute,
    0,
    timezone,
  );
  const endsAt = zonedDateTimeToUtc(
    year,
    month,
    day,
    endHour,
    endMinute,
    0,
    timezone,
  );

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { startsAt: null, endsAt: null, message: "Choose a valid date and time." };
  }

  if (startsAt >= endsAt) {
    return { startsAt, endsAt, message: "Start time must be before end time." };
  }

  return { startsAt, endsAt, message: null };
}

export function formDataToAdminWaitlistValues(formData: FormData) {
  return {
    status: formData.get("status") as WaitlistStatus,
    adminResponse:
      typeof formData.get("adminResponse") === "string"
        ? String(formData.get("adminResponse"))
        : "",
  };
}
