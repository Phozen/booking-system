import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminBookingById } from "@/lib/admin/bookings/queries";
import { getInvitationsForBooking } from "@/lib/bookings/invitations/queries";
import { createClient } from "@/lib/supabase/server";
import { AdminBookingDetail } from "@/components/admin/bookings/admin-booking-detail";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminBookingDetailPage({
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
  const [booking, invitations] = await Promise.all([
    getAdminBookingById(supabase, id),
    getInvitationsForBooking(supabase, id),
  ]);

  if (!booking) {
    notFound();
  }

  return <AdminBookingDetail booking={booking} invitations={invitations} />;
}
