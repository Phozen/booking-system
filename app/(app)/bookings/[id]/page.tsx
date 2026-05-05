import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getMyBookingById } from "@/lib/bookings/queries";
import { createClient } from "@/lib/supabase/server";
import { BookingDetail } from "@/components/bookings/booking-detail";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireUser();
  const { id } = await params;

  if (!user || !uuidPattern.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const booking = await getMyBookingById(supabase, user.id, id);

  if (!booking) {
    notFound();
  }

  return <BookingDetail booking={booking} />;
}
