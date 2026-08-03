import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import {
  getAdminBookings,
  type AdminBookingFilters,
} from "@/lib/admin/bookings/queries";
import { adminBookingStatusOptions } from "@/lib/admin/bookings/validation";
import type { BookingStatus } from "@/lib/bookings/queries";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { AdminBookingsTable } from "@/components/admin/bookings/admin-bookings-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseStatus(value: string | undefined): BookingStatus | undefined {
  if (!value || value === "all") {
    return undefined;
  }

  return adminBookingStatusOptions.includes(
    value as (typeof adminBookingStatusOptions)[number],
  )
    ? (value as BookingStatus)
    : undefined;
}

function parseDate(value: string | undefined) {
  return value && datePattern.test(value) ? value : undefined;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    facilityId?: string;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
    level?: string;
  }>;
}) {
  await requireAdmin();
  const {
    status,
    facilityId,
    dateFrom,
    dateTo,
    q,
    level,
  } = await searchParams;
  const supabase = await createClient();
  const facilities = await getAdminFacilities(supabase);
  const selectedStatus = parseStatus(status);
  const selectedFacilityId =
    facilityId &&
    facilityId !== "all" &&
    facilities.some((item) => item.id === facilityId)
      ? facilityId
      : undefined;
  const selectedDateFrom = parseDate(dateFrom);
  const selectedDateTo = parseDate(dateTo);
  const selectedUserSearch = q?.trim() || undefined;
  const levelOptions = [
    ...new Set(facilities.map((facility) => facility.level).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  const selectedLevel =
    level && level !== "all" && levelOptions.includes(level)
      ? level
      : undefined;

  const filters: AdminBookingFilters = {
    status: selectedStatus,
    facilityId: selectedFacilityId,
    dateFrom: selectedDateFrom,
    dateTo: selectedDateTo,
    userSearch: selectedUserSearch,
    level: selectedLevel,
  };
  const bookings = await getAdminBookings(supabase, filters);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Admin bookings"
        title="Booking management"
        primaryAction={
          <Link
            href="/admin/bookings/new"
            className={buttonVariants({ className: "w-full sm:w-auto" })}
          >
            <CalendarPlus data-icon="inline-start" />
            Book for user
          </Link>
        }
      />

      <AdminBookingsTable
        bookings={bookings}
        facilities={facilities}
        levelOptions={levelOptions}
        selectedStatus={selectedStatus}
        selectedFacilityId={selectedFacilityId}
        selectedDateFrom={selectedDateFrom}
        selectedDateTo={selectedDateTo}
        selectedUserSearch={selectedUserSearch}
        selectedLevel={selectedLevel}
      />
    </main>
  );
}
