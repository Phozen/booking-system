import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getEquipmentItems } from "@/lib/admin/equipment/queries";
import { getFacilityAvailabilityTimeline } from "@/lib/facilities/availability-timeline";
import { getAdminFacilityById } from "@/lib/facilities/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings/queries";
import { FacilityForm } from "@/components/admin/facilities/facility-form";
import { FacilityEquipmentManager } from "@/components/admin/facilities/facility-equipment-manager";
import { FacilityArchiveAction } from "@/components/admin/facilities/facility-archive-action";
import { FacilityDeleteAction } from "@/components/admin/facilities/facility-delete-action";
import { FacilityPhotoManager } from "@/components/admin/facilities/facility-photo-manager";
import { FacilityAvailabilityTimeline } from "@/components/facilities/facility-availability-timeline";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditFacilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [facility, equipment, settings] = await Promise.all([
    getAdminFacilityById(supabase, id),
    getEquipmentItems(createAdminClient()),
    getAppSettings(),
  ]);

  if (!facility) {
    notFound();
  }
  const selectedDate =
    query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
      ? query.date
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: settings.defaultTimezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
  const timeline = await getFacilityAvailabilityTimeline(createAdminClient(), {
    facilityId: facility.id,
    date: selectedDate,
    timezone: settings.defaultTimezone,
    adminView: true,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title={`Edit ${facility.name}`}
        description={`${facility.code} - Manage facility details, booking behavior, and employee-facing photos.`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Facilities", href: "/admin/facilities" },
          { label: facility.name },
        ]}
        secondaryAction={
          <Link
            href="/admin/facilities"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Facilities
          </Link>
        }
      />

      <section className="rounded-lg border bg-card p-5">
        <FacilityForm facility={facility} />
      </section>

      <FacilityEquipmentManager facility={facility} equipment={equipment} />

      <FacilityAvailabilityTimeline
        facilityId={facility.id}
        date={selectedDate}
        items={timeline}
        basePath={`/admin/facilities/${facility.id}`}
      />

      <FacilityPhotoManager facility={facility} />

      <FacilityArchiveAction
        facilityId={facility.id}
        facilityName={facility.name}
        isArchived={facility.isArchived || facility.status === "archived"}
      />
      <FacilityDeleteAction
        facilityId={facility.id}
        facilityName={facility.name}
      />
    </main>
  );
}
