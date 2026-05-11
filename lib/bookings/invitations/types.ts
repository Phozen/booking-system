import type { BookingStatus } from "@/lib/bookings/queries";
import type { FacilityType } from "@/lib/facilities/validation";

export type BookingInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "removed";

export type InvitationProfile = {
  id: string;
  email: string;
  fullName: string | null;
};

export type BookingInvitation = {
  id: string;
  bookingId: string;
  invitedUserId: string;
  invitedBy: string;
  status: BookingInvitationStatus;
  responseMessage: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  invitedUser: InvitationProfile | null;
  inviter: InvitationProfile | null;
};

export type InviteCandidate = InvitationProfile;

export type InvitedBooking = {
  invitation: BookingInvitation;
  booking: {
    id: string;
    facilityId: string;
    userId: string;
    title: string;
    description: string | null;
    attendeeCount: number | null;
    status: BookingStatus;
    startsAt: string;
    endsAt: string;
    approvalRequired: boolean;
    createdAt: string;
    updatedAt: string;
    facility: {
      id: string;
      name: string;
      slug?: string;
      level: string;
      type: FacilityType;
    } | null;
    organizer: InvitationProfile | null;
  };
};
