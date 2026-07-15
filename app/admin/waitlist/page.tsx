import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getAdminWaitlistRequests } from "@/lib/waitlist/queries";
import { AdminWaitlistList } from "@/components/admin/waitlist/admin-waitlist-list";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  await requireAdmin();
  const supabase = await createClient();
  const requests = await getAdminWaitlistRequests(supabase);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Scheduling support"
        title="Waitlist and alternatives"
        description="Review employee requests, suggest practical alternatives, and close requests once the scheduling question is resolved."
      />

      <AdminWaitlistList requests={requests} />
    </main>
  );
}
