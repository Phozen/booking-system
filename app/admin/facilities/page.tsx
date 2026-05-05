import { requireAdmin } from "@/lib/auth/guards";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { FacilitiesTable } from "@/components/admin/facilities/facilities-table";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminFacilitiesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const facilities = await getAdminFacilities(supabase);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Facility management"
        description="Manage facility records, status, capacity, approval behavior, and display order."
      />

      <FacilitiesTable facilities={facilities} />
    </main>
  );
}
