import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminMaintenanceClosures } from "@/lib/admin/maintenance/queries";
import { createClient } from "@/lib/supabase/server";
import { MaintenanceTable } from "@/components/admin/maintenance/maintenance-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminMaintenancePage() {
  await requireAdmin();
  const supabase = await createClient();
  const maintenanceClosures = await getAdminMaintenanceClosures(supabase);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Maintenance closures"
        description="Schedule, complete, or cancel facility maintenance periods. Scheduled and in-progress closures block bookings; completed and cancelled records stay for history."
        primaryAction={
          <Link
            href="/admin/maintenance/new"
            className={buttonVariants({ size: "sm" })}
          >
            <PlusCircle data-icon="inline-start" />
            New closure
          </Link>
        }
      />

      <MaintenanceTable maintenanceClosures={maintenanceClosures} />
    </main>
  );
}
