import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminBlockedPeriods } from "@/lib/admin/blocked-periods/queries";
import { createClient } from "@/lib/supabase/server";
import { BlockedPeriodsTable } from "@/components/admin/blocked-periods/blocked-periods-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminBlockedDatesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const blockedPeriods = await getAdminBlockedPeriods(supabase);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Blocked dates"
        description="Create and manage unavailable time ranges for all facilities or selected rooms. Active blocked periods prevent affected bookings; inactive records are kept for history."
        primaryAction={
          <Link
            href="/admin/blocked-dates/new"
            className={buttonVariants({ size: "sm" })}
          >
            <PlusCircle data-icon="inline-start" />
            New blocked period
          </Link>
        }
      />

      <BlockedPeriodsTable blockedPeriods={blockedPeriods} />
    </main>
  );
}
