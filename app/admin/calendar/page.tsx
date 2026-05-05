import { requireAdmin } from "@/lib/auth/guards";
import {
  getAdminCalendarBookings,
  type AdminCalendarBooking,
} from "@/lib/admin/bookings/calendar-queries";
import { adminBookingStatusOptions } from "@/lib/admin/bookings/validation";
import { formatBookingStatus } from "@/lib/bookings/format";
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
import { formatFacilityType } from "@/lib/facilities/format";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
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

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    status?: string | string[];
    facilityId?: string | string[];
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const facilities = await getAdminFacilities(supabase);
  const validFacilityIds = new Set(facilities.map((facility) => facility.id));
  const selectedMonth = parseCalendarMonth(params.month);
  const selectedStatus = parseStatus(params.status);
  const selectedFacilityId = parseFacilityId(
    params.facilityId,
    validFacilityIds,
  );
  const range = getCalendarMonthRange(selectedMonth);
  const bookings = await getAdminCalendarBookings(supabase, range, {
    status: selectedStatus,
    facilityId: selectedFacilityId,
  });
  const calendarBookings = bookings.map(toCalendarBooking);
  const groupedBookings = groupCalendarBookingsByDay(calendarBookings);
  const days = getCalendarMonthDays(selectedMonth);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Booking Calendar"
        description={
          selectedStatus
            ? `Showing ${formatBookingStatus(selectedStatus).toLowerCase()} bookings for ${selectedMonth.label}.`
            : `Showing all bookings for ${selectedMonth.label}.`
        }
      />

      <CalendarControls
        basePath="/admin/calendar"
        selectedMonth={selectedMonth}
        selectedStatus={selectedStatus}
        selectedFacilityId={selectedFacilityId}
        facilities={facilities}
        showFacilityFilter
      />

      <MonthCalendarGrid days={days} groupedBookings={groupedBookings} />
      <BookingAgendaList days={days} groupedBookings={groupedBookings} />
    </main>
  );
}
