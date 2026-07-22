import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

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
