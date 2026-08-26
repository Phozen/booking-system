import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getActiveBookingUserOptions } from "@/lib/admin/bookings/queries";
import { getBookableFacilities } from "@/lib/bookings/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveDepartments } from "@/lib/departments/queries";
import { AdminCreateBookingForm } from "@/components/admin/bookings/admin-create-booking-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewAdminBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireAdmin();
  const { date } = await searchParams;
  const supabase = createAdminClient();
  const [facilities, users, settings, departments] = await Promise.all([
    getBookableFacilities(supabase),
    getActiveBookingUserOptions(supabase),
    getAppSettings(),
    getActiveDepartments(supabase),
  ]);
  const defaultDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Create booking for user"
        description="Create an operational booking on behalf of an active internal user. Availability and approval rules still apply."
        backAction={
          <Link
            href="/admin/bookings"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to bookings
          </Link>
        }
      />

      <section className="rounded-lg border bg-card p-5">
        <AdminCreateBookingForm
          facilities={facilities}
          users={users}
          settings={settings}
          departments={departments}
          defaultDate={defaultDate}
        />
      </section>
    </main>
  );
}
