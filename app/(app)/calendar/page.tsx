import { requireUser } from "@/lib/auth/guards";
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
import { getInvitationContextLabel } from "@/lib/bookings/invitations/validation";
import { getAppSettings } from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { adminBookingStatusOptions } from "@/lib/admin/bookings/validation";
import { BookingAgendaList } from "@/components/calendar/booking-agenda-list";
import { CalendarDayDetailPanel } from "@/components/calendar/calendar-day-detail-panel";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { CalendarRelationshipLegend } from "@/components/calendar/calendar-relationship-legend";
import { MonthCalendarGrid } from "@/components/calendar/month-calendar-grid";
import { PageHeader } from "@/components/shared/page-header";
import type { BookingRelationship } from "@/components/shared/booking-relationship-tokens";
import {
  bookingRelationshipTokens,
  getBookingRelationshipToken,
} from "@/components/shared/booking-relationship-tokens";

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

function toRelationship(
  booking: EmployeeCalendarBooking,
): BookingRelationship {
  return booking.visibilityContext === "invited" || booking.invitationStatus
    ? "invited"
    : "owned";
}

function toCalendarBooking(booking: EmployeeCalendarBooking): CalendarBooking {
  const relationship = toRelationship(booking);
  const contextLabel = booking.invitationStatus
    ? getInvitationContextLabel(booking.invitationStatus)
    : getBookingRelationshipToken(relationship).label;
  const userLabel =
    booking.user?.fullName && booking.user.email
      ? `${booking.user.fullName} (${booking.user.email})`
      : booking.user?.email || booking.user?.fullName || undefined;

  return {
    id: booking.id,
    href: `/bookings/${booking.id}`,
    title: booking.title,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    facilityName: booking.facility?.name ?? "Room unavailable",
    facilityLevel: booking.facility?.level ?? "Level unavailable",
    approvalRequired: booking.approvalRequired,
    userLabel,
    contextLabel,
    relationship,
    isManageable: relationship === "owned",
  };
}

export default async function EmployeeCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    status?: string | string[];
    date?: string | string[];
  }>;
}) {
  const { user } = await requireUser();
  const params = await searchParams;
  const settings = await getAppSettings();
  const selectedMonth = parseCalendarMonth(params.month, settings.defaultTimezone);
  const selectedStatus = parseStatus(params.status);
  const range = getCalendarMonthRange(selectedMonth, settings.defaultTimezone);
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const bookings = await getEmployeeCalendarBookings(
    supabase,
    user.id,
    range,
    {
      status: selectedStatus,
    },
    adminSupabase,
  );
  const calendarBookings = bookings.map(toCalendarBooking);
  const groupedBookings = groupCalendarBookingsByDay(calendarBookings);
  const days = getCalendarMonthDays(selectedMonth, settings.defaultTimezone);
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const selectedDay =
    days.find((day) => day.key === requestedDate) ??
    days.find((day) => day.isToday) ??
    days[0];
  const selectedBookings = groupedBookings[selectedDay.key] ?? [];
  const getDayHref = (dayKey: string) => {
    const query = new URLSearchParams();

    query.set("month", selectedMonth.value);
    if (selectedStatus) {
      query.set("status", selectedStatus);
    }
    query.set("date", dayKey);

    return `/calendar?${query.toString()}`;
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Calendar"
        description="Your bookings and invitations for the month. Tap a day for details."
        className="pb-2"
      />

      <div className="grid gap-3">
        <CalendarControls
          basePath="/calendar"
          selectedMonth={selectedMonth}
          selectedStatus={selectedStatus}
          timezone={settings.defaultTimezone}
          compact
        />
        <CalendarRelationshipLegend
          items={[
            {
              relationship: "owned",
              label: bookingRelationshipTokens.owned.shortLabel,
            },
            {
              relationship: "invited",
              label: bookingRelationshipTokens.invited.shortLabel,
            },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <MonthCalendarGrid
          days={days}
          groupedBookings={groupedBookings}
          selectedDate={selectedDay.key}
          getDayHref={getDayHref}
        />
        <CalendarDayDetailPanel
          day={selectedDay}
          bookings={selectedBookings}
          timezone={settings.defaultTimezone}
          bookingWindowStart={settings.bookingWindowStart}
          bookingWindowEnd={settings.bookingWindowEnd}
        />
      </div>
      <BookingAgendaList days={days} groupedBookings={groupedBookings} />
    </main>
  );
}
