"use server";

import { revalidatePath } from "next/cache";

import { createAuditLogSafely } from "@/lib/audit/log";
import { requireUser } from "@/lib/auth/guards";
import { formatBookingDateTime } from "@/lib/bookings/format";
import type { InvitationActionResult } from "@/lib/bookings/invitations/action-state";
import type { BookingInvitationStatus } from "@/lib/bookings/invitations/types";
import {
  canInviteUser,
  formDataToInvitationResponseValues,
  formDataToInviteUserValues,
  invitationIdSchema,
  invitationResponseSchema,
  inviteUserSchema,
} from "@/lib/bookings/invitations/validation";
import { createAdminClient } from "@/lib/supabase/admin";

type BookingForInvitation = {
  id: string;
  user_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  facilities: { name: string; level: string } | { name: string; level: string }[] | null;
  profiles: { email: string; full_name: string | null } | { email: string; full_name: string | null }[] | null;
};

type ProfileForInvitation = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
};

type ExistingInvitation = {
  id: string;
  booking_id: string;
  invited_user_id: string;
  invited_by: string;
  status: BookingInvitationStatus;
  response_message: string | null;
  responded_at: string | null;
};

function firstRecord<T>(record: T | T[] | null | undefined) {
  return Array.isArray(record) ? record[0] : record ?? null;
}

function revalidateInvitationPaths(bookingId: string) {
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/invitations");
  revalidatePath("/my-bookings");
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");
}

function formatProfileLabel(profile: { full_name: string | null; email: string }) {
  return profile.full_name?.trim() || profile.email;
}

function formatBookingWindow(startsAt: string, endsAt: string) {
  return `${formatBookingDateTime(startsAt)} to ${formatBookingDateTime(endsAt)}`;
}

async function getBookingForInvitationAction(
  bookingId: string,
): Promise<BookingForInvitation | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,user_id,title,starts_at,ends_at,facilities(name,level),profiles!bookings_user_id_fkey(email,full_name)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load booking.");
  }

  return data as unknown as BookingForInvitation | null;
}

async function queueInvitationNotification({
  type,
  booking,
  recipient,
  actor,
  status,
}: {
  type: "booking_invitation" | "booking_invitation_accepted" | "booking_invitation_declined";
  booking: BookingForInvitation;
  recipient: { id: string; email: string; full_name: string | null };
  actor: { id: string; email: string; full_name: string | null };
  status: BookingInvitationStatus;
}) {
  try {
    const supabase = createAdminClient();
    const facility = firstRecord(booking.facilities);
    const actorLabel = formatProfileLabel(actor);
    const subjectByType: Record<typeof type, string> = {
      booking_invitation: `Invitation: ${booking.title}`,
      booking_invitation_accepted: `Invitation accepted: ${booking.title}`,
      booking_invitation_declined: `Invitation declined: ${booking.title}`,
    };
    const bodyByType: Record<typeof type, string> = {
      booking_invitation: `${actorLabel} invited you to ${booking.title}.`,
      booking_invitation_accepted: `${actorLabel} accepted the invitation for ${booking.title}.`,
      booking_invitation_declined: `${actorLabel} declined the invitation for ${booking.title}.`,
    };
    const { error } = await supabase.from("email_notifications").insert({
      type,
      status: "queued",
      recipient_email: recipient.email,
      recipient_user_id: recipient.id,
      subject: subjectByType[type],
      body: bodyByType[type],
      template_name: type,
      template_data: {
        bookingId: booking.id,
        title: booking.title,
        facilityName: facility?.name,
        facilityLevel: facility?.level,
        startsAt: booking.starts_at,
        endsAt: booking.ends_at,
        invitationStatus: status,
        actorName: actor.full_name,
        actorEmail: actor.email,
      },
      related_booking_id: booking.id,
    });

    if (error) {
      console.error("Invitation notification insert failed", {
        bookingId: booking.id,
        type,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Invitation notification unavailable", error);
  }
}

export async function inviteUserToBookingAction(
  _previousState: InvitationActionResult,
  formData: FormData,
): Promise<InvitationActionResult> {
  const { user } = await requireUser();
  const parsed = inviteUserSchema.safeParse(formDataToInviteUserValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Choose an active internal user to invite.",
    };
  }

  const supabase = createAdminClient();
  const booking = await getBookingForInvitationAction(parsed.data.bookingId);

  if (!booking || booking.user_id !== user.id) {
    return {
      status: "error",
      message: "You can only invite users to bookings you own.",
    };
  }

  const { data: invitee, error: inviteeError } = await supabase
    .from("profiles")
    .select("id,email,full_name,status")
    .eq("id", parsed.data.invitedUserId)
    .maybeSingle();

  if (inviteeError || !invitee) {
    return {
      status: "error",
      message: "The selected user could not be found.",
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("booking_invitations")
    .select("id,booking_id,invited_user_id,invited_by,status,response_message,responded_at")
    .eq("booking_id", parsed.data.bookingId)
    .eq("invited_user_id", parsed.data.invitedUserId)
    .maybeSingle();

  if (existingError) {
    return {
      status: "error",
      message: "Invitation could not be checked. Please try again.",
    };
  }

  const inviteeProfile = invitee as ProfileForInvitation;
  const existingInvitation = existing as ExistingInvitation | null;
  const permission = canInviteUser({
    ownerUserId: user.id,
    invitedUserId: inviteeProfile.id,
    invitedUserStatus: inviteeProfile.status,
    existingInvitation,
  });

  if (!permission.allowed) {
    return {
      status: "error",
      message: permission.message,
    };
  }

  const insertResult = await supabase
    .from("booking_invitations")
    .insert({
      booking_id: booking.id,
      invited_user_id: inviteeProfile.id,
      invited_by: user.id,
      status: "pending",
    })
    .select("id,booking_id,invited_user_id,invited_by,status,response_message,responded_at")
    .single();

  if (insertResult.error || !insertResult.data) {
    console.error("Booking invitation insert failed", {
      bookingId: booking.id,
      message: insertResult.error?.message,
    });

    return {
      status: "error",
      message: "Invitation could not be created. Please try again.",
    };
  }

  const invitation = insertResult.data as ExistingInvitation;

  await createAuditLogSafely(
    supabase,
    {
      action: "create",
      entityType: "booking",
      entityId: booking.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Invited ${formatProfileLabel(inviteeProfile)} to booking ${booking.title}.`,
      newValues: {
        invitationId: invitation.id,
        invitedUserId: inviteeProfile.id,
        status: invitation.status,
      },
      metadata: { invitationId: invitation.id },
    },
    { bookingId: booking.id, invitationId: invitation.id },
  );

  await queueInvitationNotification({
    type: "booking_invitation",
    booking,
    recipient: inviteeProfile,
    actor: {
      id: user.id,
      email: user.email ?? "",
      full_name: null,
    },
    status: "pending",
  });

  revalidateInvitationPaths(booking.id);

  return {
    status: "success",
    message: `${formatProfileLabel(inviteeProfile)} has been invited.`,
  };
}

export async function removeInvitationAction(
  invitationId: string,
  _previousState: InvitationActionResult,
): Promise<InvitationActionResult> {
  void _previousState;

  const { user } = await requireUser();
  const parsed = invitationIdSchema.safeParse(invitationId);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Invitation could not be found.",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_invitations")
    .select(
      "id,booking_id,invited_user_id,invited_by,status,response_message,responded_at,bookings!booking_invitations_booking_id_fkey(id,user_id,title),invited_user:profiles!booking_invitations_invited_user_id_fkey(id,email,full_name)",
    )
    .eq("id", parsed.data)
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "Invitation could not be found.",
    };
  }

  const invitation = data as unknown as ExistingInvitation & {
    bookings: { id: string; user_id: string; title: string } | { id: string; user_id: string; title: string }[] | null;
    invited_user: ProfileForInvitation | ProfileForInvitation[] | null;
  };
  const booking = firstRecord(invitation.bookings);
  const invitee = firstRecord(invitation.invited_user);

  if (!booking || booking.user_id !== user.id) {
    return {
      status: "error",
      message: "You can only remove invitations for bookings you own.",
    };
  }

  const { error: deleteError } = await supabase
    .from("booking_invitations")
    .delete()
    .eq("id", invitation.id);

  if (deleteError) {
    console.error("Booking invitation delete failed", {
      invitationId: invitation.id,
      message: deleteError.message,
    });

    return {
      status: "error",
      message: "Invitation could not be removed. Please try again.",
    };
  }

  await createAuditLogSafely(
    supabase,
    {
      action: "delete",
      entityType: "booking",
      entityId: booking.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Removed invitation for ${invitee ? formatProfileLabel(invitee) : "an attendee"} from booking ${booking.title}.`,
      oldValues: {
        invitationId: invitation.id,
        invitedUserId: invitation.invited_user_id,
        status: invitation.status,
      },
      metadata: { invitationId: invitation.id },
    },
    { bookingId: booking.id, invitationId: invitation.id },
  );

  revalidateInvitationPaths(booking.id);

  return {
    status: "success",
    message: "Invitation removed.",
  };
}

export async function respondToInvitationAction(
  invitationId: string,
  responseStatus: "accepted" | "declined",
  _previousState: InvitationActionResult,
  formData: FormData,
): Promise<InvitationActionResult> {
  const { user } = await requireUser();
  const parsed = invitationResponseSchema.safeParse(
    formDataToInvitationResponseValues(invitationId, responseStatus, formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Response could not be saved. Keep the note under 500 characters.",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_invitations")
    .select(
      "id,booking_id,invited_user_id,invited_by,status,response_message,responded_at,bookings!booking_invitations_booking_id_fkey(id,user_id,title,starts_at,ends_at,facilities(name,level),profiles!bookings_user_id_fkey(id,email,full_name)),invited_user:profiles!booking_invitations_invited_user_id_fkey(id,email,full_name)",
    )
    .eq("id", parsed.data.invitationId)
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "Invitation could not be found.",
    };
  }

  const invitation = data as unknown as ExistingInvitation & {
    bookings: BookingForInvitation | BookingForInvitation[] | null;
    invited_user: ProfileForInvitation | ProfileForInvitation[] | null;
  };
  const booking = firstRecord(invitation.bookings);
  const invitee = firstRecord(invitation.invited_user);
  const organizer = firstRecord(booking?.profiles);

  if (!booking || invitation.invited_user_id !== user.id) {
    return {
      status: "error",
      message: "You can only respond to your own invitations.",
    };
  }

  if (invitation.status !== "pending") {
    return {
      status: "error",
      message: "This invitation has already been answered.",
    };
  }

  const responseMessage = parsed.data.responseMessage || null;
  const respondedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("booking_invitations")
    .update({
      status: parsed.data.status,
      response_message: responseMessage,
      responded_at: respondedAt,
    })
    .eq("id", invitation.id)
    .eq("invited_user_id", user.id)
    .eq("status", "pending")
    .select("id,status,response_message,responded_at")
    .maybeSingle();

  if (updateError || !updated) {
    console.error("Booking invitation response failed", {
      invitationId: invitation.id,
      message: updateError?.message,
    });

    return {
      status: "error",
      message: "Invitation response could not be saved. Please refresh and try again.",
    };
  }

  await createAuditLogSafely(
    supabase,
    {
      action: "update",
      entityType: "booking",
      entityId: booking.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `${parsed.data.status === "accepted" ? "Accepted" : "Declined"} invitation for booking ${booking.title}.`,
      oldValues: {
        invitationId: invitation.id,
        status: invitation.status,
        responseMessage: invitation.response_message,
        respondedAt: invitation.responded_at,
      },
      newValues: {
        invitationId: invitation.id,
        status: parsed.data.status,
        responseMessage,
        respondedAt,
      },
      metadata: { invitationId: invitation.id },
    },
    { bookingId: booking.id, invitationId: invitation.id },
  );

  if (organizer?.email && invitee) {
    await queueInvitationNotification({
      type:
        parsed.data.status === "accepted"
          ? "booking_invitation_accepted"
          : "booking_invitation_declined",
      booking,
      recipient: {
        id: booking.user_id,
        email: organizer.email,
        full_name: organizer.full_name,
      },
      actor: invitee,
      status: parsed.data.status,
    });
  }

  revalidateInvitationPaths(booking.id);

  return {
    status: "success",
    message:
      parsed.data.status === "accepted"
        ? `Invitation accepted for ${formatBookingWindow(booking.starts_at, booking.ends_at)}.`
        : "Invitation declined.",
  };
}
