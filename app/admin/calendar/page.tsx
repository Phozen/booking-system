import { requireAdmin } from "@/lib/auth/guards";
import {
  getAdminCalendarBookings,
  type AdminCalendarBooking,
} from "@/lib/admin/bookings/calendar-queries";
import {
  getEmployeeCalendarBookings,
  type EmployeeCalendarBooking,
} from "@/lib/bookings/calendar-queries";
import { adminBookingStatusOptions } from "@/lib/admin/bookings/validation";
import { formatBookingStatus } from "@/lib/bookings/format";
import type { BookingStatus } from "@/lib/bookings/queries";
import {
  getCalendarMonthDays,
  getCalendarMonthRange,
  parseCalendarMonth,
} from "@/lib/calendar/date-range";
import {
  buildCalendarHref,
  getSelectedCalendarDay,
  parseCalendarDateParam,
} from "@/lib/calendar/selection";
import { parseCalendarViewMode } from "@/lib/calendar/visibility";
import {
  groupCalendarBookingsByDay,
  type CalendarBooking,
} from "@/lib/calendar/group-bookings";
import { formatFacilityType } from "@/lib/facilities/format";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BookingAgendaList } from "@/components/calendar/booking-agenda-list";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { CalendarDayDetailPanel } from "@/components/calendar/calendar-day-detail-panel";
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

function parseFacilityId(
  value: string | string[] | undefined,
  validFacilityIds: Set<string>,
) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue || rawValue === "all" || !validFacilityIds.has(rawValue)) {
    return undefined;
  }

  return rawValue;
}

function toCalendarBooking(booking: AdminCalendarBooking): CalendarBooking {
  const userLabel =
    booking.user?.fullName && booking.user.email
      ? `${booking.user.fullName} (${booking.user.email})`
      : booking.user?.email || booking.user?.fullName || "Unknown user";

  return {
    id: booking.id,
    href: `/admin/bookings/${booking.id}`,
    title: booking.title,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    facilityName: booking.facility?.name ?? "Facility unavailable",
    facilityLevel: booking.facility?.level ?? "Level unavailable",
    facilityType: booking.facility
      ? formatFacilityType(booking.facility.type)
      : undefined,
    userLabel,
    approvalRequired: booking.approvalRequired,
  };
}

function employeeBookingToAdminCalendarBooking(
  booking: EmployeeCalendarBooking,
): CalendarBooking {
  return {
    id: booking.id,
    href: `/admin/bookings/${booking.id}`,
    title: booking.title,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    facilityName: booking.facility?.name ?? "Facility unavailable",
    facilityLevel: booking.facility?.level ?? "Level unavailable",
    facilityType: booking.facility
      ? formatFacilityType(booking.facility.type)
      : undefined,
    approvalRequired: booking.approvalRequired,
    contextLabel: booking.invitationStatus ? "Invited" : "Owned",
    isManageable: true,
  };
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    status?: string | string[];
    facilityId?: string | string[];
    view?: string | string[];
    date?: string | string[];
  }>;
}) {
  const { user } = await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [facilities, settings] = await Promise.all([
    getAdminFacilities(supabase),
    getAppSettings(),
  ]);
  const validFacilityIds = new Set(facilities.map((facility) => facility.id));
  const selectedMonth = parseCalendarMonth(params.month, settings.defaultTimezone);
  const selectedStatus = parseStatus(params.status);
  const selectedView = parseCalendarViewMode({
    value: params.view,
    allowAll: true,
    defaultView: "all",
  });
  const selectedFacilityId = parseFacilityId(
    params.facilityId,
    validFacilityIds,
  );
  const range = getCalendarMonthRange(selectedMonth, settings.defaultTimezone);
  const bookings =
    selectedView === "my"
      ? await getEmployeeCalendarBookings(
          supabase,
          user.id,
          range,
          { status: selectedStatus, facilityId: selectedFacilityId },
          createAdminClient(),
        )
      : await getAdminCalendarBookings(supabase, range, {
          status: selectedStatus,
          facilityId: selectedFacilityId,
        });
  const calendarBookings =
    selectedView === "my"
      ? (bookings as EmployeeCalendarBooking[]).map(
          employeeBookingToAdminCalendarBooking,
        )
      : (bookings as AdminCalendarBooking[]).map(toCalendarBooking);
  const groupedBookings = groupCalendarBookingsByDay(calendarBookings);
  const days = getCalendarMonthDays(selectedMonth, settings.defaultTimezone);
  const requestedDate = parseCalendarDateParam(params.date);
  const selectedDay = getSelectedCalendarDay(days, requestedDate);
  const selectedBookings = groupedBookings[selectedDay.key] ?? [];
  const getDayHref = (dayKey: string) =>
    buildCalendarHref("/admin/calendar", {
      month: selectedMonth.value,
      status: selectedStatus,
      facilityId: selectedFacilityId,
      view: selectedView,
      date: dayKey,
    });
  const descriptionBase = selectedStatus
    ? `Showing ${formatBookingStatus(selectedStatus).toLowerCase()} bookings for ${selectedMonth.label}.`
    : selectedView === "my"
      ? `Showing bookings you own or are invited to for ${selectedMonth.label}.`
      : `Showing all bookings for ${selectedMonth.label}.`;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Booking Calendar"
        description={`${descriptionBase} Tap a day for details. Times use ${settings.defaultTimezone}.`}
      />

      <CalendarControls
        basePath="/admin/calendar"
        selectedMonth={selectedMonth}
        selectedStatus={selectedStatus}
        selectedFacilityId={selectedFacilityId}
        selectedDate={selectedDay.key}
        selectedView={selectedView}
        showViewToggle
        timezone={settings.defaultTimezone}
        facilities={facilities}
        showFacilityFilter
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <MonthCalendarGrid
          days={days}
          groupedBookings={groupedBookings}
          selectedDate={selectedDay.key}
          getDayHref={getDayHref}
        />
        <CalendarDayDetailPanel
          day={selectedDay}
          bookings={selectedBookings}
          bookDayHref={`/admin/bookings/new?date=${encodeURIComponent(selectedDay.key)}`}
        />
      </div>
      <BookingAgendaList days={days} groupedBookings={groupedBookings} />
    </main>
  );
}
