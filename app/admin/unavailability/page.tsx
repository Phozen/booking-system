import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminBlockedPeriods } from "@/lib/admin/blocked-periods/queries";
import { getAdminMaintenanceClosures } from "@/lib/admin/maintenance/queries";
import { createClient } from "@/lib/supabase/server";
import { UnavailabilityTable } from "@/components/admin/unavailability/unavailability-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminUnavailabilityPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [blockedPeriods, maintenanceClosures] = await Promise.all([
    getAdminBlockedPeriods(supabase),
    getAdminMaintenanceClosures(supabase),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Facility unavailability"
        description="Manage every period that prevents bookings in one place. Use a general closure for events or restrictions, and maintenance when work needs a trackable status."
        primaryAction={
          <Link href="/admin/unavailability/new" className={buttonVariants({ size: "sm" })}>
            <PlusCircle data-icon="inline-start" />
            Add unavailable time
          </Link>
        }
      />

      <UnavailabilityTable
        blockedPeriods={blockedPeriods}
        maintenanceClosures={maintenanceClosures}
      />
    </main>
  );
}
