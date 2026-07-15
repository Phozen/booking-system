import { requireUser } from "@/lib/auth/guards";
import { getEmployeeFacilities } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { getMyWaitlistRequests } from "@/lib/waitlist/queries";
import { PageHeader } from "@/components/shared/page-header";
import { WaitlistRequestForm } from "@/components/waitlist/waitlist-request-form";
import { WaitlistRequestList } from "@/components/waitlist/waitlist-request-list";

export const dynamic = "force-dynamic";

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ facilityId?: string }>;
}) {
  const [{ user }, params] = await Promise.all([requireUser(), searchParams]);
  const supabase = await createClient();
  const [facilities, requests] = await Promise.all([
    getEmployeeFacilities(supabase),
    getMyWaitlistRequests(supabase, user.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Scheduling support"
        title="Waitlist and alternatives"
        description="Ask Admin to review another facility or time when your preferred slot is unavailable. A request does not reserve the slot."
      />

      <section aria-labelledby="new-waitlist-request" className="grid gap-4">
        <div>
          <h2 id="new-waitlist-request" className="text-lg font-semibold tracking-normal">
            Request an alternative
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Share your preferred date, time, attendance, and any flexibility so Admin can suggest a practical option.
          </p>
        </div>
        <WaitlistRequestForm
          facilities={facilities}
          defaultFacilityId={params.facilityId}
        />
      </section>

      <section aria-labelledby="my-waitlist-requests" className="grid gap-4">
        <div>
          <h2 id="my-waitlist-requests" className="text-lg font-semibold tracking-normal">
            My requests
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Track Admin responses or cancel a request that is no longer needed.
          </p>
        </div>
        <WaitlistRequestList requests={requests} />
      </section>
    </main>
  );
}
