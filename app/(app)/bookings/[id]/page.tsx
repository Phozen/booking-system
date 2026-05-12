import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import { getMyBookingById } from "@/lib/bookings/queries";
import {
  getInvitationsForBooking,
  getInviteCandidatesForBooking,
  getInvitedBookingById,
} from "@/lib/bookings/invitations/queries";
import type { InvitedBooking } from "@/lib/bookings/invitations/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BookingDetail } from "@/components/bookings/booking-detail";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invitedBookingToEmployeeBooking(
  invitedBooking: InvitedBooking,
): EmployeeBooking {
  const booking = invitedBooking.booking;

  return {
    id: booking.id,
    facilityId: booking.facilityId,
    userId: booking.userId,
    title: booking.title,
    description: booking.description,
    attendeeCount: booking.attendeeCount,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    approvalRequired: booking.approvalRequired,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    facility: booking.facility
      ? {
          id: booking.facility.id,
          name: booking.facility.name,
          slug: booking.facility.slug ?? "",
          level: booking.facility.level,
          type: booking.facility.type,
        }
      : null,
    approvals: [],
  };
}

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

  if (booking) {
    const adminSupabase = createAdminClient();
    const [invitations, inviteCandidates] = await Promise.all([
      getInvitationsForBooking(adminSupabase, booking.id),
      getInviteCandidatesForBooking(adminSupabase, booking.id, user.id),
    ]);

    return (
      <BookingDetail
        booking={booking}
        invitations={invitations}
        inviteCandidates={inviteCandidates}
        viewerMode="owner"
      />
    );
  }

  const invitedBooking = await getInvitedBookingById(
    createAdminClient(),
    id,
    user.id,
  );

  if (!invitedBooking) {
    notFound();
  }

  return (
    <BookingDetail
      booking={invitedBookingToEmployeeBooking(invitedBooking)}
      viewerMode="invitee"
      viewerInvitation={invitedBooking.invitation}
    />
  );
}
