import { requireUser } from "@/lib/auth/guards";
import { formatBookingStatus } from "@/lib/bookings/format";
import {
  getEmployeeCalendarBookings,
  type EmployeeCalendarBooking,
} from "@/lib/bookings/calendar-queries";
import type { BookingStatus } from "@/lib/bookings/queries";
import {
  getCalendarMonthDays,
  getCalendarMonthRange,
  parseCalendarMonth,
} from "@/lib/calendar/date-range";
import {
  groupCalendarBookingsByDay,
  type CalendarBooking,
} from "@/lib/calendar/group-bookings";
import { getAppSettings } from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { adminBookingStatusOptions } from "@/lib/admin/bookings/validation";
import { BookingAgendaList } from "@/components/calendar/booking-agenda-list";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { MonthCalendarGrid } from "@/components/calendar/month-calendar-grid";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

function parseStatus(value: string | string[] | undefined): BookingStatus | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue || rawValue === "all") {
    return undefined;
  }

  return adminBookingStatusOptions.includes(
    rawValue as (typeof adminBookingStatusOptions)[number],
  )
    ? (rawValue as BookingStatus)
    : undefined;
}

function toCalendarBooking(booking: EmployeeCalendarBooking): CalendarBooking {
  return {
    id: booking.id,
    href: `/bookings/${booking.id}`,
    title: booking.title,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    facilityName: booking.facility?.name ?? "Facility unavailable",
    facilityLevel: booking.facility?.level ?? "Level unavailable",
    approvalRequired: booking.approvalRequired,
  };
}

export default async function EmployeeCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[]; status?: string | string[] }>;
}) {
  const { user } = await requireUser();
  const params = await searchParams;
  const settings = await getAppSettings();
  const selectedMonth = parseCalendarMonth(params.month, settings.defaultTimezone);
  const selectedStatus = parseStatus(params.status);
  const range = getCalendarMonthRange(selectedMonth, settings.defaultTimezone);
  const supabase = await createClient();
  const bookings = await getEmployeeCalendarBookings(supabase, user.id, range, {
    status: selectedStatus,
  });
  const calendarBookings = bookings.map(toCalendarBooking);
  const groupedBookings = groupCalendarBookingsByDay(calendarBookings);
  const days = getCalendarMonthDays(selectedMonth, settings.defaultTimezone);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Employee bookings"
        title="Booking Calendar"
        description={
          selectedStatus
            ? `Showing your ${formatBookingStatus(selectedStatus).toLowerCase()} bookings for ${selectedMonth.label}. Times use ${settings.defaultTimezone}.`
            : `Showing your bookings for ${selectedMonth.label}. Times use ${settings.defaultTimezone}.`
        }
      />

      <CalendarControls
        basePath="/calendar"
        selectedMonth={selectedMonth}
        selectedStatus={selectedStatus}
        timezone={settings.defaultTimezone}
      />

      <MonthCalendarGrid days={days} groupedBookings={groupedBookings} />
      <BookingAgendaList days={days} groupedBookings={groupedBookings} />
    </main>
  );
}
