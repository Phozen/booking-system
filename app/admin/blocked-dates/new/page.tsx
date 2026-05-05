import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { BlockedPeriodForm } from "@/components/admin/blocked-periods/blocked-period-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewBlockedPeriodPage() {
  await requireAdmin();
  const supabase = await createClient();
  const facilities = await getAdminFacilities(supabase);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title="New blocked period"
        description="Active blocked periods prevent bookings for all facilities or the selected facilities during the scheduled window."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Blocked Dates", href: "/admin/blocked-dates" },
          { label: "New" },
        ]}
        secondaryAction={
          <Link
            href="/admin/blocked-dates"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to blocked dates
          </Link>
        }
      />

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-5 rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          Use blocked periods for office closures, company events, or temporary
          restrictions. Inactive blocked periods do not prevent new bookings.
        </div>
        <BlockedPeriodForm facilities={facilities} />
      </section>
    </main>
  );
}
