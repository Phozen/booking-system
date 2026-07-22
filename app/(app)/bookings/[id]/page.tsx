import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import { getMyBookingById } from "@/lib/bookings/queries";
import {
  getAuthorizedTeamsJoinUrl,
  getTeamsInvitationStatus,
} from "@/lib/bookings/teams-meeting-status";
import {
  getInvitationsForBooking,
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
    teamsMeeting: booking.teamsMeeting,
    catering: booking.catering,
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
          capacity: booking.facility.capacity ?? 0,
        }
      : null,
    approvals: [],
    departments: [],
  };
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; invite?: string }>;
}) {
  const { user } = await requireUser();
  const { id } = await params;
  const query = await searchParams;

  if (!user || !uuidPattern.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const booking = await getMyBookingById(supabase, user.id, id);

  if (booking) {
    const adminSupabase = createAdminClient();
    const [invitations, teamsInvitationStatus, teamsJoinUrl] = await Promise.all([
      getInvitationsForBooking(adminSupabase, booking.id),
      booking.teamsMeeting
        ? getTeamsInvitationStatus(booking.id)
        : Promise.resolve(undefined),
      booking.teamsMeeting
        ? getAuthorizedTeamsJoinUrl({ bookingId: booking.id, viewerUserId: user.id })
        : Promise.resolve(null),
    ]);

    return (
      <BookingDetail
        booking={booking}
        invitations={invitations}
        teamsInvitationStatus={teamsInvitationStatus}
        teamsJoinUrl={teamsJoinUrl}
        viewerMode="owner"
        justCreated={query.created === "1"}
        highlightInvitations={query.invite === "1"}
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

  const teamsJoinUrl = invitedBooking.booking.teamsMeeting
    ? await getAuthorizedTeamsJoinUrl({ bookingId: id, viewerUserId: user.id })
    : null;

  return (
    <BookingDetail
      booking={invitedBookingToEmployeeBooking(invitedBooking)}
      viewerMode="invitee"
      viewerInvitation={invitedBooking.invitation}
      teamsJoinUrl={teamsJoinUrl}
    />
  );
}
