import type { CalendarDay } from "@/lib/calendar/date-range";
import type { BookingStatus } from "@/lib/bookings/queries";
import type { CalendarViewMode } from "@/lib/calendar/visibility";

export function parseCalendarDateParam(
  value: string | string[] | undefined,
): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue || !/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return undefined;
  }

  return rawValue;
}

export function getSelectedCalendarDay(
  days: CalendarDay[],
  requestedDate?: string,
): CalendarDay {
  return (
    days.find((day) => day.key === requestedDate) ??
    days.find((day) => day.isToday) ??
    days[0]
  );
}

export function getCalendarDaySelectLabel(
  day: Pick<CalendarDay, "weekdayLabel" | "shortLabel">,
  bookingCount: number,
) {
  const dateLabel = `Select ${day.weekdayLabel}, ${day.shortLabel}`;

  if (bookingCount <= 0) {
    return `${dateLabel}, no bookings`;
  }

  return `${dateLabel}, ${bookingCount} booking${bookingCount === 1 ? "" : "s"}`;
}

export function buildCalendarQueryParams({
  month,
  status,
  facilityId,
  view,
  date,
}: {
  month: string;
  status?: BookingStatus;
  facilityId?: string;
  view?: CalendarViewMode;
  date?: string;
}) {
  const params = new URLSearchParams({
    month,
  });

  if (view) {
    params.set("view", view);
  }

  if (status) {
    params.set("status", status);
  }

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  if (date) {
    params.set("date", date);
  }

  return params;
}

export function buildCalendarHref(
  basePath: string,
  options: Parameters<typeof buildCalendarQueryParams>[0],
) {
  return `${basePath}?${buildCalendarQueryParams(options).toString()}`;
}
