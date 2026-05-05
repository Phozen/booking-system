import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminBlockedPeriodById } from "@/lib/admin/blocked-periods/queries";
import { getAdminFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { BlockedPeriodForm } from "@/components/admin/blocked-periods/blocked-period-form";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EditBlockedPeriodPage({
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
  const [blockedPeriod, facilities] = await Promise.all([
    getAdminBlockedPeriodById(supabase, id),
    getAdminFacilities(supabase),
  ]);

  if (!blockedPeriod) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title={`Edit ${blockedPeriod.title}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge
              kind="blocked-period"
              status={blockedPeriod.isActive}
            />
            <span>
              Active blocked periods prevent affected bookings. Inactive records
              remain visible for audit and scheduling history.
            </span>
          </span>
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Blocked Dates", href: "/admin/blocked-dates" },
          { label: "Edit" },
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
          Review the scope and schedule before saving. Changing an active
          blocked period immediately affects future availability checks.
        </div>
        <BlockedPeriodForm
          blockedPeriod={blockedPeriod}
          facilities={facilities}
        />
      </section>
    </main>
  );
}
