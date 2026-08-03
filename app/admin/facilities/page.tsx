import Link from "next/link";
import { Plus } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminFacilities } from "@/lib/facilities/queries";
import {
  facilityStatusOptions,
  facilityTypeOptions,
  type FacilityStatus,
  type FacilityType,
} from "@/lib/facilities/validation";
import { createClient } from "@/lib/supabase/server";
import { FacilitiesTable } from "@/components/admin/facilities/facilities-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminFacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    level?: string;
    type?: string;
    status?: string;
  }>;
}) {
  await requireAdmin();
  const { q, level, type, status } = await searchParams;
  const supabase = await createClient();
  const allFacilities = await getAdminFacilities(supabase);
  const levelOptions = [
    ...new Set(allFacilities.map((facility) => facility.level).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const selectedSearch = q?.trim() || undefined;
  const selectedLevel =
    level && level !== "all" && levelOptions.includes(level) ? level : undefined;
  const selectedType =
    type &&
    type !== "all" &&
    facilityTypeOptions.includes(type as FacilityType)
      ? (type as FacilityType)
      : undefined;
  const selectedStatus =
    status &&
    status !== "all" &&
    facilityStatusOptions.includes(status as FacilityStatus)
      ? (status as FacilityStatus)
      : undefined;

  const facilities = allFacilities.filter((facility) => {
    if (selectedLevel && facility.level !== selectedLevel) return false;
    if (selectedType && facility.type !== selectedType) return false;
    if (selectedStatus && facility.status !== selectedStatus) return false;
    if (selectedSearch) {
      const needle = selectedSearch.toLowerCase();
      const haystack = `${facility.name} ${facility.code}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Facility management"
        primaryAction={
          <Link
            href="/admin/facilities/new"
            className={buttonVariants({ className: "w-full sm:w-auto" })}
          >
            <Plus data-icon="inline-start" />
            New facility
          </Link>
        }
      />

      <FacilitiesTable
        facilities={facilities}
        levelOptions={levelOptions}
        selectedSearch={selectedSearch}
        selectedLevel={selectedLevel}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
      />
    </main>
  );
}
