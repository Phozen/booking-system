import { requireAdmin } from "@/lib/auth/guards";
import { getPendingApprovalBookings } from "@/lib/admin/bookings/queries";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { PendingApprovalsTable } from "@/components/admin/approvals/pending-approvals-table";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string | undefined) {
  return value && datePattern.test(value) ? value : undefined;
}

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    facilityId?: string;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
  }>;
}) {
  await requireAdmin();
  const { facilityId, dateFrom, dateTo, q } = await searchParams;
  const supabase = await createClient();
  const facilities = await getAdminFacilities(supabase);
  const selectedFacilityId =
    facilityId &&
    facilityId !== "all" &&
    facilities.some((item) => item.id === facilityId)
      ? facilityId
      : undefined;
  const selectedDateFrom = parseDate(dateFrom);
  const selectedDateTo = parseDate(dateTo);
  const selectedUserSearch = q?.trim() || undefined;

  const bookings = await getPendingApprovalBookings(supabase, {
    facilityId: selectedFacilityId,
    dateFrom: selectedDateFrom,
    dateTo: selectedDateTo,
    userSearch: selectedUserSearch,
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Approval queue"
        title="Pending room requests"
        description="Approve or reject requests before the room is confirmed."
      />

      <PendingApprovalsTable
        bookings={bookings}
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
        selectedDateFrom={selectedDateFrom}
        selectedDateTo={selectedDateTo}
        selectedUserSearch={selectedUserSearch}
      />
    </main>
  );
}
