import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildMicrosoftGraphPath, microsoftGraphFetchWithAccessToken } from "@/lib/integrations/microsoft-365-calendar/client";
import { getMicrosoftDelegatedAccessToken } from "@/lib/integrations/microsoft-365-calendar/delegated";

export type TeamsInvitationStatus = "pending" | "sent" | "failed" | "cancelled";

export async function getTeamsInvitationStatus(bookingId: string): Promise<TeamsInvitationStatus> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_calendar_syncs")
    .select("sync_status")
    .eq("booking_id", bookingId)
    .eq("provider", "microsoft_365")
    .maybeSingle();

  if (error || !data) return "pending";
  if (data.sync_status === "synced") return "sent";
  if (data.sync_status === "cancelled") return "cancelled";
  return data.sync_status === "failed" ? "failed" : "pending";
}

export async function getAuthorizedTeamsJoinUrl({
  bookingId,
  viewerUserId,
}: {
  bookingId: string;
  viewerUserId: string;
}) {
  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("user_id,teams_meeting")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking?.teams_meeting) return null;

  const isOwner = booking.user_id === viewerUserId;
  const { data: invitation } = isOwner
    ? { data: null }
    : await supabase
        .from("booking_invitations")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("invited_user_id", viewerUserId)
        .in("status", ["pending", "accepted"])
        .maybeSingle();
  if (!isOwner && !invitation) return null;

  const { data: sync } = await supabase
    .from("booking_calendar_syncs")
    .select("external_event_id,sync_status")
    .eq("booking_id", bookingId)
    .eq("provider", "microsoft_365")
    .maybeSingle();
  if (sync?.sync_status !== "synced" || !sync.external_event_id) return null;

  const token = await getMicrosoftDelegatedAccessToken(booking.user_id);
  if (!token.ok) return null;
  const event = await microsoftGraphFetchWithAccessToken<{
    onlineMeeting?: { joinUrl?: string | null } | null;
  }>(
    `${buildMicrosoftGraphPath("me", "events", sync.external_event_id)}?$select=onlineMeeting`,
    token.accessToken,
  );
  const joinUrl = event.ok ? event.data?.onlineMeeting?.joinUrl?.trim() : "";
  try {
    return joinUrl && new URL(joinUrl).protocol === "https:" ? joinUrl : null;
  } catch {
    return null;
  }
}
