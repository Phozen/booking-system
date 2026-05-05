import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { MaintenanceForm } from "@/components/admin/maintenance/maintenance-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewMaintenanceClosurePage() {
  await requireAdmin();
  const supabase = await createClient();
  const facilities = await getAdminFacilities(supabase);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title="New maintenance closure"
        description="Scheduled maintenance prevents bookings for the selected facility during the maintenance window."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Maintenance", href: "/admin/maintenance" },
          { label: "New" },
        ]}
        secondaryAction={
          <Link
            href="/admin/maintenance"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to maintenance
          </Link>
        }
      />

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-5 rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          Use maintenance closures for repairs, inspections, or setup windows.
          Scheduled and in-progress closures block bookings; completed and
          cancelled closures do not.
        </div>
        <MaintenanceForm facilities={facilities} />
      </section>
    </main>
  );
}
