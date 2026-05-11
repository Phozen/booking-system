import { z } from "zod";

import type { BookingInvitationStatus } from "@/lib/bookings/invitations/types";

export const bookingInvitationStatuses = [
  "pending",
  "accepted",
  "declined",
  "removed",
] as const satisfies readonly BookingInvitationStatus[];

export const invitationResponseStatuses = ["accepted", "declined"] as const;

export const invitationIdSchema = z.string().uuid();
export const invitationBookingIdSchema = z.string().uuid();
export const invitedUserIdSchema = z.string().uuid();

export const inviteUserSchema = z.object({
  bookingId: invitationBookingIdSchema,
  invitedUserId: invitedUserIdSchema,
});

export const invitationResponseSchema = z.object({
  invitationId: invitationIdSchema,
  status: z.enum(invitationResponseStatuses),
  responseMessage: z.string().trim().max(500).optional(),
});

export function formDataToInviteUserValues(formData: FormData) {
  return {
    bookingId: formData.get("bookingId"),
    invitedUserId: formData.get("invitedUserId"),
  };
}

export function formDataToInvitationResponseValues(
  invitationId: string,
  status: "accepted" | "declined",
  formData: FormData,
) {
  return {
    invitationId,
    status,
    responseMessage:
      typeof formData.get("responseMessage") === "string"
        ? formData.get("responseMessage")
        : "",
  };
}

export function getInvitationStatusLabel(status: BookingInvitationStatus) {
  const labels: Record<BookingInvitationStatus, string> = {
    pending: "Pending",
    accepted: "Accepted",
    declined: "Declined",
    removed: "Removed",
  };

  return labels[status];
}

export function getInvitationContextLabel(status: BookingInvitationStatus) {
  const labels: Record<BookingInvitationStatus, string> = {
    pending: "Pending invitation",
    accepted: "Accepted invitation",
    declined: "Declined invitation",
    removed: "Removed invitation",
  };

  return labels[status];
}

export function canInviteUser({
  ownerUserId,
  invitedUserId,
  invitedUserStatus,
  existingInvitation,
}: {
  ownerUserId: string;
  invitedUserId: string;
  invitedUserStatus: string | null | undefined;
  existingInvitation?: { status: BookingInvitationStatus } | null;
}) {
  if (ownerUserId === invitedUserId) {
    return {
      allowed: false,
      message: "You cannot invite yourself to your own booking.",
    };
  }

  if (invitedUserStatus !== "active") {
    return {
      allowed: false,
      message: "Only active internal users can be invited.",
    };
  }

  if (existingInvitation && existingInvitation.status !== "removed") {
    return {
      allowed: false,
      message: "This user is already invited to the booking.",
    };
  }

  return { allowed: true, message: "" };
}
