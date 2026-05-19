import { requireAdmin } from "@/lib/auth/guards";
import { getAdminWaitlistRequests } from "@/lib/waitlist/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { AdminWaitlistList } from "@/components/admin/waitlist/admin-waitlist-list";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  await requireAdmin();
  const requests = await getAdminWaitlistRequests(createAdminClient());

  return (
    <main className="grid gap-8">
      <PageHeader
        eyebrow="Operations"
        title="Waitlist / alternatives"
        description="Review employee requests for unavailable slots, suggest alternatives, and close requests when resolved."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Waitlist" },
        ]}
      />
      <AdminWaitlistList requests={requests} />
    </main>
  );
}
