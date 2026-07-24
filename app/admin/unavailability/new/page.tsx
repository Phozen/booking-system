import Link from "next/link";
import { ArrowLeft, Building2, Wrench } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { BlockedPeriodForm } from "@/components/admin/blocked-periods/blocked-period-form";
import { MaintenanceForm } from "@/components/admin/maintenance/maintenance-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewUnavailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdmin();
  const selectedType = (await searchParams).type;
  const type = selectedType === "closure" || selectedType === "maintenance"
    ? selectedType
    : null;
  const supabase = await createClient();
  const [facilities, settings] = await Promise.all([
    getAdminFacilities(supabase),
    getAppSettings(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Add unavailable time"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Unavailability", href: "/admin/unavailability" },
          { label: "New" },
        ]}
        secondaryAction={
          <Link href="/admin/unavailability" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft data-icon="inline-start" />
            Back to unavailability
          </Link>
        }
      />

      <section aria-labelledby="unavailability-type-heading">
        <h2 id="unavailability-type-heading" className="font-semibold tracking-normal">
          What is making the facility unavailable?
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/unavailability/new?type=closure"
            className={cn(
              "grid gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
              type === "closure" && "border-primary bg-primary/5 ring-1 ring-primary/25",
            )}
          >
            <Building2 className="size-5 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold">General closure</span>
            <span className="text-sm leading-5 text-muted-foreground">
              Office closures, events, setup time, or temporary restrictions. Can affect one, several, or all facilities.
            </span>
          </Link>
          <Link
            href="/admin/unavailability/new?type=maintenance"
            className={cn(
              "grid gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
              type === "maintenance" && "border-primary bg-primary/5 ring-1 ring-primary/25",
            )}
          >
            <Wrench className="size-5 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold">Maintenance</span>
            <span className="text-sm leading-5 text-muted-foreground">
              Repairs or inspections for one facility, with scheduled, in-progress, completed, and cancelled statuses.
            </span>
          </Link>
        </div>
      </section>

      {type ? (
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-5 rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            {type === "closure"
              ? "The closure remains effective while active. Use it when no maintenance lifecycle is needed."
              : "Scheduled and in-progress maintenance blocks bookings; completed and cancelled maintenance does not."}
          </div>
          {type === "closure" ? (
            <BlockedPeriodForm facilities={facilities} timezone={settings.defaultTimezone} returnPath="/admin/unavailability" />
          ) : (
            <MaintenanceForm facilities={facilities} timezone={settings.defaultTimezone} returnPath="/admin/unavailability" />
          )}
        </section>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Choose a reason above to continue.
        </p>
      )}
    </main>
  );
}
