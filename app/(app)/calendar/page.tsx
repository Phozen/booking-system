import { requireUser } from "@/lib/auth/guards";
import { formatBookingStatus } from "@/lib/bookings/format";
import {
  getCompanyCalendarBookings,
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
  parseCalendarViewMode,
  shouldShowAllBookingsToggle,
} from "@/lib/calendar/visibility";
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
  const isOther = booking.visibilityContext === "other";
  const contextLabel = isOther
    ? "Other booking"
    : booking.invitationStatus
      ? getInvitationContextLabel(booking.invitationStatus)
      : "Owned";
  const userLabel =
    booking.user?.fullName && booking.user.email
      ? `${booking.user.fullName} (${booking.user.email})`
      : booking.user?.email || booking.user?.fullName || undefined;

  return {
    id: booking.id,
    href: isOther ? undefined : `/bookings/${booking.id}`,
    title: isOther ? "Booked time" : booking.title,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    facilityName: booking.facility?.name ?? "Facility unavailable",
    facilityLevel: booking.facility?.level ?? "Level unavailable",
    approvalRequired: booking.approvalRequired,
    userLabel,
    contextLabel,
    isManageable: !isOther,
  };
}

export default async function EmployeeCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    status?: string | string[];
    view?: string | string[];
    date?: string | string[];
  }>;
}) {
  const { user, profile } = await requireUser();
  const params = await searchParams;
  const settings = await getAppSettings();
  const allowAllBookings = shouldShowAllBookingsToggle(
    profile.role,
    settings.calendarVisibilityMode,
  );
  const selectedView = parseCalendarViewMode({
    value: params.view,
    allowAll: allowAllBookings,
  });
  const selectedMonth = parseCalendarMonth(params.month, settings.defaultTimezone);
  const selectedStatus = parseStatus(params.status);
  const range = getCalendarMonthRange(selectedMonth, settings.defaultTimezone);
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const bookings =
    selectedView === "all"
      ? await getCompanyCalendarBookings(adminSupabase, user.id, range, {
          status: selectedStatus,
        })
      : await getEmployeeCalendarBookings(
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
    if (selectedView !== "my") {
      query.set("view", selectedView);
    }
    query.set("date", dayKey);

    return `/calendar?${query.toString()}`;
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Employee bookings"
        title="Booking Calendar"
        description={
          selectedStatus
            ? `Showing your ${formatBookingStatus(selectedStatus).toLowerCase()} owned and invited bookings for ${selectedMonth.label}. Times use ${settings.defaultTimezone}.`
            : selectedView === "all"
              ? `Showing company booking visibility for ${selectedMonth.label}. Other users' booking items show limited details. Times use ${settings.defaultTimezone}.`
              : `Showing your owned and invited bookings for ${selectedMonth.label}. Times use ${settings.defaultTimezone}.`
        }
      />

      <CalendarControls
        basePath="/calendar"
        selectedMonth={selectedMonth}
        selectedStatus={selectedStatus}
        selectedView={selectedView}
        showViewToggle={allowAllBookings}
        timezone={settings.defaultTimezone}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
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
