import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { groupEmployeeBookings } from "@/lib/bookings/grouping";
import { getMyInvitationSummary } from "@/lib/bookings/invitations/queries";
import { getMyBookings } from "@/lib/bookings/queries";
import { createClient } from "@/lib/supabase/server";
import { MyBookingsList } from "@/components/bookings/my-bookings-list";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { user } = await requireUser();
  const { created } = await searchParams;
  const supabase = await createClient();
  const [bookings, invitationSummary] = await Promise.all([
    getMyBookings(supabase, user.id),
    getMyInvitationSummary(supabase, user.id),
  ]);
  const groupedBookings = groupEmployeeBookings(bookings);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Employee bookings"
        title="My Bookings"
        description="Track pending, upcoming, historical, and cancelled bookings."
        primaryAction={
          <Link href="/bookings/new" className={buttonVariants()}>
            <CalendarPlus data-icon="inline-start" />
            New booking
          </Link>
        }
      />

      <MyBookingsList
        groupedBookings={groupedBookings}
        created={created === "1"}
        invitationSummary={invitationSummary}
      />
    </main>
  );
}
