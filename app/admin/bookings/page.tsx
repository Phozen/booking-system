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

export const dynamic = "force-dynamic";

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

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; facilityId?: string }>;
}) {
  await requireAdmin();
  const { status, facilityId } = await searchParams;
  const supabase = await createClient();
  const facilities = await getAdminFacilities(supabase);
  const selectedStatus = parseStatus(status);
  const selectedFacilityId =
    facilityId &&
    facilityId !== "all" &&
    facilities.some((item) => item.id === facilityId)
      ? facilityId
      : undefined;
  const filters: AdminBookingFilters = {
    status: selectedStatus,
    facilityId: selectedFacilityId,
  };
  const bookings = await getAdminBookings(supabase, filters);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Booking management"
        description="Review bookings, filter by status or facility, and open booking details for cancellation or approval actions."
      />

      <AdminBookingsTable
        bookings={bookings}
        facilities={facilities}
        selectedStatus={selectedStatus}
        selectedFacilityId={selectedFacilityId}
      />
    </main>
  );
}
