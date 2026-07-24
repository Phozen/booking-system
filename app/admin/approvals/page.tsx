import { requireAdmin } from "@/lib/auth/guards";
import { getPendingApprovalBookings } from "@/lib/admin/bookings/queries";
import { createClient } from "@/lib/supabase/server";
import { PendingApprovalsTable } from "@/components/admin/approvals/pending-approvals-table";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const bookings = await getPendingApprovalBookings(supabase);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Approval queue"
        title="Pending room requests"
      />

      <PendingApprovalsTable bookings={bookings} />
    </main>
  );
}
