export const calendarVisibilityModes = [
  "my_bookings_only",
  "all_company_bookings",
] as const;

export type CalendarVisibilityMode = (typeof calendarVisibilityModes)[number];

export const calendarViewModes = ["my", "all"] as const;

export type CalendarViewMode = (typeof calendarViewModes)[number];

export function parseCalendarVisibilityMode(
  value: unknown,
): CalendarVisibilityMode {
  return value === "all_company_bookings"
    ? "all_company_bookings"
    : "my_bookings_only";
}

export function canUseAllCompanyCalendar(
  mode: CalendarVisibilityMode,
  isAdmin = false,
) {
  return isAdmin || mode === "all_company_bookings";
}

export function parseCalendarViewMode({
  value,
  allowAll,
  defaultView = "my",
}: {
  value: string | string[] | undefined;
  allowAll: boolean;
  defaultView?: CalendarViewMode;
}): CalendarViewMode {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "all" && allowAll) {
    return "all";
  }

  if (rawValue === "my") {
    return "my";
  }

  return defaultView === "all" && allowAll ? "all" : "my";
}
