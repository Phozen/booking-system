import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditActionType =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "cancel"
  | "login"
  | "logout"
  | "export"
  | "role_change"
  | "settings_change";

export type AuditEntityType =
  | "user"
  | "facility"
  | "booking"
  | "booking_approval"
  | "blocked_period"
  | "maintenance_closure"
  | "email_notification"
  | "system_setting"
  | "report"
  | "auth";

export type AuditLogInput = {
  action: AuditActionType;
  entityType: AuditEntityType;
  entityId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  summary?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function createAuditLog(
  supabase: SupabaseClient,
  input: AuditLogInput,
) {
  const { error } = await supabase.from("audit_logs").insert({
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    actor_user_id: input.actorUserId ?? null,
    actor_email: input.actorEmail ?? null,
    summary: input.summary ?? null,
    old_values: input.oldValues ?? null,
    new_values: input.newValues ?? null,
    metadata: input.metadata ?? {},
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function createAuditLogSafely(
  supabase: SupabaseClient,
  input: AuditLogInput,
  context: Record<string, unknown> = {},
) {
  try {
    await createAuditLog(supabase, input);
  } catch (error) {
    console.error("Audit log insert failed", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ...context,
      error,
    });
  }
}

