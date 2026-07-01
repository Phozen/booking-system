import Link from "next/link";

import { requireUser } from "@/lib/auth/guards";
import { getEmployeeFacilities } from "@/lib/facilities/queries";
import {
  formatContactAdministratorMessage,
  getAppSettings,
} from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { FacilityCard } from "@/components/facilities/facility-card";
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
        eyebrow="Rooms"
        title="Rooms"
        description="Use this lightweight room list when capacity, level, or equipment matters. Book directly when you know the room."
      />

      {facilities.length > 0 ? (
        <section className="grid gap-4">
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No active facilities are available"
          description={`Facilities may be inactive, archived, or temporarily unavailable. ${formatContactAdministratorMessage(settings)}`}
          action={
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline" })}
            >
              Back to dashboard
            </Link>
          }
        />
      )}
    </main>
  );
}
