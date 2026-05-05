import { z } from "zod";

import type { AuditActionType, AuditEntityType } from "@/lib/audit/log";

export const auditActionOptions = [
  "all",
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "cancel",
  "login",
  "logout",
  "export",
  "role_change",
  "settings_change",
] as const;

export const auditEntityTypeOptions = [
  "all",
  "user",
  "facility",
  "booking",
  "booking_approval",
  "blocked_period",
  "maintenance_closure",
  "email_notification",
  "system_setting",
  "report",
  "auth",
] as const;

export type AuditLogFilters = {
  dateFrom: string;
  dateTo: string;
  dateFromIso: string;
  dateToExclusiveIso: string;
  actorEmail?: string;
  action?: AuditActionType;
  entityType?: AuditEntityType;
  page: number;
  limit: number;
};

export type AuditLogFilterInput = {
  dateFrom?: string | string[];
  dateTo?: string | string[];
  actorEmail?: string | string[];
  action?: string | string[];
  entityType?: string | string[];
  page?: string | string[];
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const auditLogFilterSchema = z.object({
  dateFrom: z.string().regex(datePattern).optional(),
  dateTo: z.string().regex(datePattern).optional(),
  actorEmail: z.string().trim().max(160).optional(),
  action: z.enum(auditActionOptions).optional(),
  entityType: z.enum(auditEntityTypeOptions).optional(),
  page: z.coerce.number().int().positive().optional(),
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

export function parseAuditLogFilters(
  input: AuditLogFilterInput,
): AuditLogFilters {
  const defaults = getDefaultDateInputs();
  const parsed = auditLogFilterSchema.safeParse({
    dateFrom: firstValue(input.dateFrom),
    dateTo: firstValue(input.dateTo),
    actorEmail: firstValue(input.actorEmail),
    action: firstValue(input.action),
    entityType: firstValue(input.entityType),
    page: firstValue(input.page),
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
    actorEmail: values.actorEmail || undefined,
    action:
      values.action && values.action !== "all"
        ? (values.action as AuditActionType)
        : undefined,
    entityType:
      values.entityType && values.entityType !== "all"
        ? (values.entityType as AuditEntityType)
        : undefined,
    page: values.page ?? 1,
    limit: 100,
  };
}

export function auditLogFiltersToSearchParams(
  filters: AuditLogFilters,
  overrides: Partial<Pick<AuditLogFilters, "page">> = {},
) {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    action: filters.action ?? "all",
    entityType: filters.entityType ?? "all",
    page: String(overrides.page ?? filters.page),
  });

  if (filters.actorEmail) {
    params.set("actorEmail", filters.actorEmail);
  }

  return params;
}

