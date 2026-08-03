import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminBlockedPeriods } from "@/lib/admin/blocked-periods/queries";
import { getAdminMaintenanceClosures } from "@/lib/admin/maintenance/queries";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { UnavailabilityTable } from "@/components/admin/unavailability/unavailability-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string | undefined) {
  return value && datePattern.test(value) ? value : undefined;
}

export default async function AdminUnavailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    active?: string;
    scope?: string;
    facilityId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  await requireAdmin();
  const { type, active, scope, facilityId, dateFrom, dateTo } =
    await searchParams;
  const supabase = await createClient();
  const [blockedPeriods, maintenanceClosures, facilities] = await Promise.all([
    getAdminBlockedPeriods(supabase),
    getAdminMaintenanceClosures(supabase),
    getAdminFacilities(supabase),
  ]);

  const selectedType =
    type === "closure" || type === "maintenance" ? type : undefined;
  const selectedActive =
    active === "active" || active === "inactive" ? active : undefined;
  const selectedScope =
    scope === "all_facilities" ||
    scope === "selected_facilities" ||
    scope === "facility"
      ? scope
      : undefined;
  const selectedFacilityId =
    facilityId &&
    facilityId !== "all" &&
    facilities.some((item) => item.id === facilityId)
      ? facilityId
      : undefined;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Facility unavailability"
        primaryAction={
          <Link
            href="/admin/unavailability/new"
            className={buttonVariants({ size: "sm" })}
          >
            <PlusCircle data-icon="inline-start" />
            Add unavailable time
          </Link>
        }
      />

      <UnavailabilityTable
        blockedPeriods={blockedPeriods}
        maintenanceClosures={maintenanceClosures}
        facilities={facilities}
        selectedType={selectedType}
        selectedActive={selectedActive}
        selectedScope={selectedScope}
        selectedFacilityId={selectedFacilityId}
        selectedDateFrom={parseDate(dateFrom)}
        selectedDateTo={parseDate(dateTo)}
      />
    </main>
  );
}
