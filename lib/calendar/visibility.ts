export const calendarVisibilityModes = [
  "my_bookings_only",
  "admins_only",
  "all_users",
] as const;

export type CalendarVisibilityMode = (typeof calendarVisibilityModes)[number];

export const calendarViewModes = ["my", "all"] as const;

export type CalendarViewMode = (typeof calendarViewModes)[number];

export type CalendarVisibilityRole = "employee" | "admin" | "super_admin";

export function parseCalendarVisibilityMode(
  value: unknown,
): CalendarVisibilityMode {
  if (value === "all_company_bookings") {
    return "all_users";
  }

  return calendarVisibilityModes.includes(value as CalendarVisibilityMode)
    ? (value as CalendarVisibilityMode)
    : "my_bookings_only";
}

export function getCalendarVisibilityMode(settings: {
  calendarVisibilityMode?: unknown;
}) {
  return parseCalendarVisibilityMode(settings.calendarVisibilityMode);
}

export function canViewAllCalendarBookings(
  role: CalendarVisibilityRole,
  mode: CalendarVisibilityMode,
) {
  if (mode === "all_users") {
    return true;
  }

  if (mode === "admins_only") {
    return role === "admin" || role === "super_admin";
  }

  return false;
}

export function shouldShowAllBookingsToggle(
  role: CalendarVisibilityRole,
  mode: CalendarVisibilityMode,
) {
  return canViewAllCalendarBookings(role, mode);
}

export function getCalendarVisibilityLabel(mode: CalendarVisibilityMode) {
  const labels: Record<CalendarVisibilityMode, string> = {
    my_bookings_only: "My bookings only",
    admins_only: "Admins only",
    all_users: "All users",
  };

  return labels[mode];
}

export function canUseAllCompanyCalendar(
  mode: CalendarVisibilityMode,
  roleOrIsAdmin: CalendarVisibilityRole | boolean = "employee",
) {
  const role =
    typeof roleOrIsAdmin === "boolean"
      ? roleOrIsAdmin
        ? "admin"
        : "employee"
      : roleOrIsAdmin;

  return canViewAllCalendarBookings(role, mode);
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
