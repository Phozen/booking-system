import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminMaintenanceClosureById } from "@/lib/admin/maintenance/queries";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { MaintenanceForm } from "@/components/admin/maintenance/maintenance-form";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EditMaintenanceClosurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [maintenanceClosure, facilities, settings] = await Promise.all([
    getAdminMaintenanceClosureById(supabase, id),
    getAdminFacilities(supabase),
    getAppSettings(),
  ]);

  if (!maintenanceClosure) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title={`Edit ${maintenanceClosure.title}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge
              kind="maintenance"
              status={maintenanceClosure.status}
            />
            <span>
              {maintenanceClosure.facility
                ? `${maintenanceClosure.facility.name}, ${maintenanceClosure.facility.level}`
                : "Facility unavailable"}
              . Scheduled and in-progress maintenance blocks bookings.
            </span>
          </span>
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Maintenance", href: "/admin/maintenance" },
          { label: "Edit" },
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
          Updating the schedule or status changes availability for this
          facility. Completed or cancelled closures no longer block future
          bookings.
        </div>
        <MaintenanceForm
          maintenanceClosure={maintenanceClosure}
          facilities={facilities}
          timezone={settings.defaultTimezone}
        />
      </section>
    </main>
  );
}
