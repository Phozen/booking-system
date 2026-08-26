import Link from "next/link";

import { requireUser } from "@/lib/auth/guards";
import { getEmployeeFacilities } from "@/lib/facilities/queries";
import { employeeCopy } from "@/lib/employee/plain-language";
import {
  formatContactAdministratorMessage,
  getAppSettings,
} from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { FacilityCard } from "@/components/facilities/facility-card";
import { BackLink } from "@/components/shared/back-link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function FacilitiesPage() {
  await requireUser();
  const supabase = await createClient();
  const [facilities, settings] = await Promise.all([
    getEmployeeFacilities(supabase),
    getAppSettings(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow={employeeCopy.rooms}
        title={employeeCopy.rooms}
        description="Browse rooms by size, floor, and equipment. Then book the one you need."
        primaryAction={
          <Link href="/bookings/new" className={buttonVariants({ size: "lg" })}>
            {employeeCopy.bookARoom}
          </Link>
        }
      />

      {facilities.length > 0 ? (
        <section className="qbook-stagger grid gap-4" aria-label="Available rooms">
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No rooms are available right now"
          description={`Rooms may be closed or temporarily unavailable. ${formatContactAdministratorMessage(settings)}`}
          action={
            <BackLink href="/dashboard">Back to home</BackLink>
          }
        />
      )}
    </main>
  );
}
