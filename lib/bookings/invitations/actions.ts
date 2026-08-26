"use server";

import { revalidatePath } from "next/cache";

import { createAuditLogSafely } from "@/lib/audit/log";
import { requireUser } from "@/lib/auth/guards";
import type {
  InvitationActionResult,
  InvitationBatchActionResult,
  InvitationBatchFailure,
} from "@/lib/bookings/invitations/action-state";
import type { BookingInvitationStatus } from "@/lib/bookings/invitations/types";
import { INTERNAL_INVITES_ENABLED } from "@/lib/bookings/invitations/feature";
import { syncConfirmedBookingToMicrosoftCalendar } from "@/lib/integrations/microsoft-365-calendar/sync";
import {
  canInviteUser,
  canManageBookingInvitations,
  formDataToInviteUserValues,
  invitationIdSchema,
  invitationManagementLockedMessage,
  inviteUserSchema,
  inviteUsersSchema,
} from "@/lib/bookings/invitations/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueInviteeBookingConfirmations } from "@/lib/email/invitee-notifications";

type BookingForInvitation = {
  id: string;
  user_id: string;
  title: string;
  status: string;
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

async function getBookingForInvitationAction(
  bookingId: string,
): Promise<BookingForInvitation | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,user_id,title,status,starts_at,ends_at,facilities(name,level),profiles!bookings_user_id_fkey(email,full_name)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load booking.");
  }

  return data as unknown as BookingForInvitation | null;
}

async function syncConfirmedInvitationAttendeesSafely({
  booking,
  actor,
  reason,
}: {
  booking: Pick<BookingForInvitation, "id" | "status">;
  actor: { id: string; email?: string | null };
  reason: string;
}) {
  if (booking.status !== "confirmed") {
    return;
  }

  try {
    const result = await syncConfirmedBookingToMicrosoftCalendar(booking.id, {
      userId: actor.id,
      email: actor.email,
      reason,
    });

    if (result.status === "failed") {
      console.error("Invitation attendee calendar resync failed", {
        bookingId: booking.id,
        reason,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Invitation attendee calendar resync unavailable", {
      bookingId: booking.id,
      reason,
      error,
    });
  }
}

export async function queueInitialInvitationNotifications({
  bookingId,
  invitedUserIds,
  actor,
}: {
  bookingId: string;
  invitedUserIds: string[];
  actor: { id: string; email: string; full_name: string | null };
}) {
  if (!INTERNAL_INVITES_ENABLED || invitedUserIds.length === 0) return;

  try {
    const [booking, profilesResult] = await Promise.all([
      getBookingForInvitationAction(bookingId),
      createAdminClient()
        .from("profiles")
        .select("id,email,full_name,status")
        .in("id", invitedUserIds)
        .eq("status", "active"),
    ]);

    if (!booking || profilesResult.error) {
      if (profilesResult.error) {
        console.error("Initial invitation recipient lookup failed", {
          bookingId,
          message: profilesResult.error.message,
        });
      }
      return;
    }

    if (booking.status === "confirmed" && (profilesResult.data?.length ?? 0) > 0) {
      await queueInviteeBookingConfirmations({
        bookingId,
        inviteeUserIds: invitedUserIds,
      });
    }
  } catch (error) {
    console.error("Initial invitation notifications unavailable", { bookingId, error });
  }
}

export async function inviteUserToBookingAction(
  _previousState: InvitationActionResult,
  formData: FormData,
): Promise<InvitationActionResult> {
  if (!INTERNAL_INVITES_ENABLED) {
    return {
      status: "error",
      message: "Internal invitations are turned off.",
    };
  }

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

  if (!canManageBookingInvitations(booking.status)) {
    return {
      status: "error",
      message: invitationManagementLockedMessage,
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
      status: "accepted",
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

  if (booking.status === "confirmed") {
    await queueInviteeBookingConfirmations({
      bookingId: booking.id,
      inviteeUserIds: [inviteeProfile.id],
    });
  }
  await syncConfirmedInvitationAttendeesSafely({
    booking,
    actor: {
      id: user.id,
      email: user.email,
    },
    reason: "invitation_created",
  });

  revalidateInvitationPaths(booking.id);

  return {
    status: "success",
    message: `${formatProfileLabel(inviteeProfile)} has been added.`,
  };
}

export async function inviteUsersToBookingAction(
  bookingId: string,
  invitedUserIds: string[],
): Promise<InvitationBatchActionResult> {
  if (!INTERNAL_INVITES_ENABLED) {
    return {
      status: "error",
      message: "Internal invitations are turned off.",
      invitedUserIds: [],
      failures: [],
    };
  }

  const { user } = await requireUser();
  const parsed = inviteUsersSchema.safeParse({
    bookingId,
    invitedUserIds,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Choose between 1 and 50 active internal users.",
      invitedUserIds: [],
      failures: [],
    };
  }

  const uniqueInvitedUserIds = [...new Set(parsed.data.invitedUserIds)];

  const supabase = createAdminClient();
  const booking = await getBookingForInvitationAction(parsed.data.bookingId);

  if (!booking || booking.user_id !== user.id) {
    return {
      status: "error",
      message: "You can only invite users to bookings you own.",
      invitedUserIds: [],
      failures: [],
    };
  }

  if (!canManageBookingInvitations(booking.status)) {
    return {
      status: "error",
      message: invitationManagementLockedMessage,
      invitedUserIds: [],
      failures: [],
    };
  }

  const [{ data: profiles, error: profilesError }, { data: existing, error: existingError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,full_name,status")
        .in("id", uniqueInvitedUserIds),
      supabase
        .from("booking_invitations")
        .select("id,booking_id,invited_user_id,invited_by,status,response_message,responded_at")
        .eq("booking_id", booking.id)
        .in("invited_user_id", uniqueInvitedUserIds),
    ]);

  if (profilesError || existingError) {
    return {
      status: "error",
      message: "Invitees could not be checked. Please try again.",
      invitedUserIds: [],
      failures: [],
    };
  }

  const profilesById = new Map(
    ((profiles as ProfileForInvitation[] | null) ?? []).map((profile) => [
      profile.id,
      profile,
    ]),
  );
  const existingByUserId = new Map(
    ((existing as ExistingInvitation[] | null) ?? []).map((invitation) => [
      invitation.invited_user_id,
      invitation,
    ]),
  );
  const failures: InvitationBatchFailure[] = [];
  const eligibleProfiles: ProfileForInvitation[] = [];

  for (const invitedUserId of uniqueInvitedUserIds) {
    const profile = profilesById.get(invitedUserId);

    if (!profile) {
      failures.push({
        userId: invitedUserId,
        message: "This user is no longer available.",
      });
      continue;
    }

    const permission = canInviteUser({
      ownerUserId: user.id,
      invitedUserId: profile.id,
      invitedUserStatus: profile.status,
      existingInvitation: existingByUserId.get(profile.id),
    });

    if (!permission.allowed) {
      failures.push({ userId: profile.id, message: permission.message });
      continue;
    }

    eligibleProfiles.push(profile);
  }

  if (eligibleProfiles.length === 0) {
    return {
      status: "error",
      message: "No new invitations were sent.",
      invitedUserIds: [],
      failures,
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("booking_invitations")
    .upsert(
      eligibleProfiles.map((profile) => ({
        booking_id: booking.id,
        invited_user_id: profile.id,
        invited_by: user.id,
        status: "accepted",
      })),
      {
        onConflict: "booking_id,invited_user_id",
        ignoreDuplicates: true,
      },
    )
    .select("id,booking_id,invited_user_id,invited_by,status,response_message,responded_at");

  if (insertError) {
    console.error("Batch booking invitation insert failed", {
      bookingId: booking.id,
      inviteeCount: eligibleProfiles.length,
      message: insertError.message,
    });

    return {
      status: "error",
      message: "Invitations could not be created. Your selections were preserved.",
      invitedUserIds: [],
      failures,
    };
  }

  const invitations = (inserted as ExistingInvitation[] | null) ?? [];
  const insertedUserIds = new Set(
    invitations.map((invitation) => invitation.invited_user_id),
  );

  for (const profile of eligibleProfiles) {
    if (!insertedUserIds.has(profile.id)) {
      failures.push({
        userId: profile.id,
        message: "This user was already invited by another request.",
      });
    }
  }

  await Promise.all(
    invitations.map(async (invitation) => {
      const invitee = profilesById.get(invitation.invited_user_id);

      if (!invitee) {
        return;
      }

      await createAuditLogSafely(
        supabase,
        {
          action: "create",
          entityType: "booking",
          entityId: booking.id,
          actorUserId: user.id,
          actorEmail: user.email,
          summary: `Added ${formatProfileLabel(invitee)} to booking ${booking.title}.`,
          newValues: {
            invitationId: invitation.id,
            invitedUserId: invitee.id,
            status: invitation.status,
          },
          metadata: { invitationId: invitation.id, batch: true },
        },
        { bookingId: booking.id, invitationId: invitation.id },
      );
    }),
  );

  if (booking.status === "confirmed" && invitations.length > 0) {
    await queueInviteeBookingConfirmations({
      bookingId: booking.id,
      inviteeUserIds: invitations.map((invitation) => invitation.invited_user_id),
    });
  }

  if (invitations.length > 0) {
    await syncConfirmedInvitationAttendeesSafely({
      booking,
      actor: {
        id: user.id,
        email: user.email,
      },
      reason: "invitations_created",
    });
    revalidateInvitationPaths(booking.id);
  }

  const invitedIds = invitations.map((invitation) => invitation.invited_user_id);
  const sentLabel = `${invitedIds.length} attendee${invitedIds.length === 1 ? "" : "s"} added`;

  return {
    status: invitedIds.length > 0 ? "success" : "error",
    message:
      failures.length > 0
        ? `${sentLabel}. ${failures.length} could not be added and remain selected.`
        : `${sentLabel}.`,
    invitedUserIds: invitedIds,
    failures,
  };
}

export async function removeInvitationAction(
  invitationId: string,
  _previousState: InvitationActionResult,
): Promise<InvitationActionResult> {
  void _previousState;

  if (!INTERNAL_INVITES_ENABLED) {
    return {
      status: "error",
      message: "Internal invitations are turned off.",
    };
  }

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
      "id,booking_id,invited_user_id,invited_by,status,response_message,responded_at,bookings!booking_invitations_booking_id_fkey(id,user_id,title,status),invited_user:profiles!booking_invitations_invited_user_id_fkey(id,email,full_name)",
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
    bookings:
      | { id: string; user_id: string; title: string; status: string }
      | { id: string; user_id: string; title: string; status: string }[]
      | null;
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

  if (!canManageBookingInvitations(booking.status)) {
    return {
      status: "error",
      message: invitationManagementLockedMessage,
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
  await syncConfirmedInvitationAttendeesSafely({
    booking,
    actor: {
      id: user.id,
      email: user.email,
    },
    reason: "invitation_removed",
  });

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
  void invitationId;
  void responseStatus;
  void _previousState;
  void formData;

  return {
    status: "error",
    message: "Invitation responses are not used. Open the booking for details.",
  };
}

