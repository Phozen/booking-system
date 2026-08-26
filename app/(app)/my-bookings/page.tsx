import { requireUser } from "@/lib/auth/guards";
import { groupEmployeeBookings } from "@/lib/bookings/grouping";
import { getMyBookings } from "@/lib/bookings/queries";
import { createClient } from "@/lib/supabase/server";
import { MyBookingsList } from "@/components/bookings/my-bookings-list";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; highlight?: string }>;
}) {
  const { user } = await requireUser();
  const { created, highlight } = await searchParams;
  const supabase = await createClient();
  const bookings = await getMyBookings(supabase, user.id);
  const groupedBookings = groupEmployeeBookings(bookings);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="My bookings"
        description="Review pending requests, upcoming rooms, and past bookings."
      />

      <MyBookingsList
        groupedBookings={groupedBookings}
        created={created === "1"}
        highlightId={highlight}
      />
    </main>
  );
}
