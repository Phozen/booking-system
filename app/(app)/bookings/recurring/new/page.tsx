import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getBookableFacilities } from "@/lib/bookings/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { RecurringBookingForm } from "@/components/bookings/recurring/recurring-booking-form";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewRecurringBookingPage() {
  await requireUser();
  const supabase = await createClient();
  const facilities = await getBookableFacilities(supabase);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Recurring booking"
        title="Create recurring booking"
        description="Generate a finite series of normal bookings. The system checks every occurrence before anything is created."
        breadcrumbs={[
          { label: "Bookings", href: "/my-bookings" },
          { label: "Recurring booking" },
        ]}
        secondaryAction={
          <Link href="/bookings/new" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft data-icon="inline-start" />
            One-time booking
          </Link>
        }
      />
      <RecurringBookingForm facilities={facilities} />
    </main>
  );
}
