import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminBookingById } from "@/lib/admin/bookings/queries";
import { getInvitationsForBooking } from "@/lib/bookings/invitations/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { getCompanyDisplayName } from "@/lib/settings/app-settings";
import { createClient } from "@/lib/supabase/server";
import { BookingPrintForm } from "@/components/bookings/print/booking-print-form";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminBookingPrintPage({
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
  const [booking, invitations, settings] = await Promise.all([
    getAdminBookingById(supabase, id),
    getInvitationsForBooking(supabase, id),
    getAppSettings(),
  ]);

  if (!booking) {
    notFound();
  }

  return (
    <BookingPrintForm
      booking={booking}
      requester={{
        fullName: booking.user?.fullName ?? null,
        email: booking.user?.email ?? null,
        department: booking.user?.department ?? null,
        phone: booking.user?.phone ?? null,
      }}
      invitations={invitations}
      appName={settings.appName}
      companyName={getCompanyDisplayName(settings)}
      backHref={`/admin/bookings/${booking.id}`}
    />
  );
}
