import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getMyBookingById } from "@/lib/bookings/queries";
import { getBookableFacilities } from "@/lib/bookings/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { BookingEditForm } from "@/components/bookings/booking-edit-form";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EditBookingPage({
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
  const [booking, facilities, settings] = await Promise.all([
    getMyBookingById(supabase, user.id, id),
    getBookableFacilities(supabase),
    getAppSettings(),
  ]);

  if (!booking || !["pending", "confirmed"].includes(booking.status)) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="My bookings"
        title="Edit booking"
        description="Update booking details or reschedule. Availability is checked again before changes are saved."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Bookings", href: "/my-bookings" },
          { label: booking.title, href: `/bookings/${booking.id}` },
          { label: "Edit" },
        ]}
      />

      <section className="rounded-lg border bg-card p-5">
        <BookingEditForm
          booking={booking}
          facilities={facilities}
          settings={settings}
        />
      </section>
    </main>
  );
}
