import {
  defaultCalendarTimeZone,
  formatCalendarDateKey,
} from "@/lib/calendar/date-range";
import type { BookingStatus } from "@/lib/bookings/queries";

export type CalendarBooking = {
  id: string;
  href?: string;
  title: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  facilityName: string;
  facilityLevel: string;
  facilityType?: string;
  userLabel?: string;
  contextLabel?: string;
  approvalRequired?: boolean;
  isManageable?: boolean;
};

export type GroupedCalendarBookings = Record<string, CalendarBooking[]>;

export function groupCalendarBookingsByDay(
  bookings: CalendarBooking[],
  timeZone = defaultCalendarTimeZone,
): GroupedCalendarBookings {
  return bookings.reduce<GroupedCalendarBookings>((groups, booking) => {
    const key = formatCalendarDateKey(new Date(booking.startsAt), timeZone);

    groups[key] = [...(groups[key] ?? []), booking].sort((a, b) =>
      a.startsAt.localeCompare(b.startsAt),
    );

    return groups;
  }, {});
}
