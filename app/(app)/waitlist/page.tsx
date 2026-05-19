import { ClipboardList } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getBookableFacilities } from "@/lib/bookings/queries";
import { getMyWaitlistRequests } from "@/lib/waitlist/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { WaitlistRequestForm } from "@/components/waitlist/waitlist-request-form";
import { WaitlistRequestList } from "@/components/waitlist/waitlist-request-list";

export const dynamic = "force-dynamic";

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ facilityId?: string }>;
}) {
  const { user } = await requireUser();
  const { facilityId } = await searchParams;
  const supabase = await createClient();
  const [facilities, requests] = await Promise.all([
    getBookableFacilities(supabase),
    getMyWaitlistRequests(supabase, user.id),
  ]);
  const defaultFacilityId = facilities.some((facility) => facility.id === facilityId)
    ? facilityId
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Booking requests"
        title="Waitlist / alternative requests"
        description="Ask Admin to review an unavailable slot or suggest another facility. Requests do not reserve rooms and normal booking conflict checks still apply."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Waitlist" }]}
      />

      <section className="grid gap-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-normal">New request</h2>
        </div>
        <WaitlistRequestForm
          facilities={facilities}
          defaultFacilityId={defaultFacilityId}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold tracking-normal">My requests</h2>
        <WaitlistRequestList requests={requests} />
      </section>
    </main>
  );
}
