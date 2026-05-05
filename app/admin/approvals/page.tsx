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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Pending approvals"
        description="Review pending booking requests that require approval."
      />

      <PendingApprovalsTable bookings={bookings} />
    </main>
  );
}
