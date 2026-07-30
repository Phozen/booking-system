import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getMyBookingById } from "@/lib/bookings/queries";
import { getInvitationsForBooking } from "@/lib/bookings/invitations/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { getCompanyDisplayName } from "@/lib/settings/app-settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BookingPrintForm } from "@/components/bookings/print/booking-print-form";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EmployeeBookingPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireUser();
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const booking = await getMyBookingById(supabase, user.id, id);

  if (!booking) {
    notFound();
  }

  const adminSupabase = createAdminClient();
  const [{ data: requester }, invitations, settings] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select("email,full_name,department,phone")
      .eq("id", user.id)
      .maybeSingle(),
    getInvitationsForBooking(adminSupabase, booking.id),
    getAppSettings(),
  ]);

  return (
    <BookingPrintForm
      booking={booking}
      requester={{
        fullName: requester?.full_name ?? null,
        email: requester?.email ?? user.email ?? null,
        department: requester?.department ?? null,
        phone: requester?.phone ?? null,
      }}
      invitations={invitations}
      appName={settings.appName}
      companyName={getCompanyDisplayName(settings)}
      backHref={`/bookings/${booking.id}`}
    />
  );
}
