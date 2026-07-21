import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditActionType } from "@/lib/audit/log";

export type BookingActivity = {
  id: string;
  action: AuditActionType;
  actorEmail: string | null;
  summary: string | null;
  createdAt: string;
};

export async function getAdminBookingActivity(
  supabase: SupabaseClient,
  bookingId: string,
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,action,actor_email,summary,created_at")
    .eq("entity_type", "booking")
    .eq("entity_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error("Unable to load booking activity.");
  }

  return ((data ?? []) as {
    id: string;
    action: AuditActionType;
    actor_email: string | null;
    summary: string | null;
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    action: row.action,
    actorEmail: row.actor_email,
    summary: row.summary,
    createdAt: row.created_at,
  }));
}
