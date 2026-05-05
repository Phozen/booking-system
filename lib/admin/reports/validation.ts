import { z } from "zod";

import type { BookingStatus } from "@/lib/bookings/queries";
import type { ReportFilterInput, ReportFilters } from "@/lib/admin/reports/types";

export const reportBookingStatusOptions = [
  "all",
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
  "expired",
] as const;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const reportFilterSchema = z.object({
  dateFrom: z.string().regex(datePattern).optional(),
  dateTo: z.string().regex(datePattern).optional(),
  facilityId: z
    .string()
    .refine((value) => value === "all" || uuidPattern.test(value))
    .optional(),
  status: z.enum(reportBookingStatusOptions).optional(),
});

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function dateInputToUtcStart(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getDefaultDateInputs() {
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = addDays(to, -29);

  return {
    dateFrom: toDateInput(from),
    dateTo: toDateInput(to),
  };
}

export function parseReportFilters(input: ReportFilterInput): ReportFilters {
  const defaults = getDefaultDateInputs();
  const parsed = reportFilterSchema.safeParse({
    dateFrom: firstValue(input.dateFrom),
    dateTo: firstValue(input.dateTo),
    facilityId: firstValue(input.facilityId),
    status: firstValue(input.status),
  });

  const values = parsed.success ? parsed.data : {};
  const dateFrom = values.dateFrom ?? defaults.dateFrom;
  const dateTo = values.dateTo ?? defaults.dateTo;
  const dateFromValue = dateInputToUtcStart(dateFrom);
  const dateToValue = dateInputToUtcStart(dateTo);
  const normalizedDates =
    dateFromValue <= dateToValue
      ? { dateFrom, dateTo, dateFromValue, dateToValue }
      : {
          dateFrom: defaults.dateFrom,
          dateTo: defaults.dateTo,
          dateFromValue: dateInputToUtcStart(defaults.dateFrom),
          dateToValue: dateInputToUtcStart(defaults.dateTo),
        };

  return {
    dateFrom: normalizedDates.dateFrom,
    dateTo: normalizedDates.dateTo,
    dateFromIso: normalizedDates.dateFromValue.toISOString(),
    dateToExclusiveIso: addDays(normalizedDates.dateToValue, 1).toISOString(),
    facilityId:
      values.facilityId && values.facilityId !== "all"
        ? values.facilityId
        : undefined,
    status:
      values.status && values.status !== "all"
        ? (values.status as BookingStatus)
        : undefined,
  };
}

export function parseReportFiltersFromSearchParams(
  searchParams: URLSearchParams,
) {
  return parseReportFilters({
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    facilityId: searchParams.get("facilityId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
}

export function serializeReportFilters(filters: ReportFilters) {
  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    facilityId: filters.facilityId ?? "all",
    status: filters.status ?? "all",
  };
}

