import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getBookableFacilities } from "@/lib/bookings/queries";
import type { Facility } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/bookings/booking-form";
import { PageHeader } from "@/components/shared/page-header";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ facilityId?: string }>;
}) {
  const { profile } = await requireUser();
  const { facilityId } = await searchParams;

  let facilities: Facility[] = [];
  let loadError = false;

  try {
    const supabase = await createClient();
    facilities = await getBookableFacilities(supabase);
  } catch (error) {
    console.error("Bookable facilities load failed", error);
    loadError = true;
  }

  const selectedFacilityId = facilities.some(
    (facility) => facility.id === facilityId,
  )
    ? facilityId
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Employee booking"
        title="Create booking"
        description="Choose a facility, date, and time. The system checks conflicts before saving."
        breadcrumbs={[
          { label: "Facilities", href: "/facilities" },
          { label: "Create booking" },
        ]}
        secondaryAction={
          <Link
            href="/facilities"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Facilities
          </Link>
        }
      />

      {profile?.status !== "active" ? (
        <Alert variant="destructive">
          <AlertTitle>Booking unavailable</AlertTitle>
          <AlertDescription>
            Your account is not active for booking.
          </AlertDescription>
        </Alert>
      ) : loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Facilities unavailable</AlertTitle>
          <AlertDescription>
            Facilities could not be loaded. Please try again.
          </AlertDescription>
        </Alert>
      ) : (
        <section className="rounded-lg border bg-card p-5">
          <BookingForm
            facilities={facilities}
            selectedFacilityId={selectedFacilityId}
          />
        </section>
      )}
    </main>
  );
}
