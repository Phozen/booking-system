import { requireAdmin } from "@/lib/auth/guards";
import { getEquipmentItems } from "@/lib/admin/equipment/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { EquipmentManager } from "@/components/admin/equipment/equipment-manager";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminEquipmentPage() {
  await requireAdmin();
  const equipment = await getEquipmentItems(createAdminClient());

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Equipment management"
        description="Maintain the equipment library used by facility pages and facility assignment controls."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Equipment" },
        ]}
      />

      <EquipmentManager equipment={equipment} />
    </main>
  );
}
