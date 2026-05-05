import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditActionType, AuditEntityType } from "@/lib/audit/log";
import type { AuditLogFilters } from "@/lib/admin/audit-logs/validation";

export type AuditJsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

type AuditLogRecord = {
  id: string;
  action: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  summary: string | null;
  old_values: AuditJsonValue;
  new_values: AuditJsonValue;
  metadata: AuditJsonValue;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  action: AuditActionType;
  entityType: AuditEntityType;
  entityId: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  summary: string | null;
  oldValues: AuditJsonValue;
  newValues: AuditJsonValue;
  metadata: AuditJsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AuditLogListResult = {
  rows: AuditLog[];
  totalCount: number;
  page: number;
  limit: number;
  pageCount: number;
};

const auditLogSelect = `
  id,
  action,
  entity_type,
  entity_id,
  actor_user_id,
  actor_email,
  summary,
  old_values,
  new_values,
  metadata,
  ip_address,
  user_agent,
  created_at
`;

function mapAuditLog(record: AuditLogRecord): AuditLog {
  return {
    id: record.id,
    action: record.action,
    entityType: record.entity_type,
    entityId: record.entity_id,
    actorUserId: record.actor_user_id,
    actorEmail: record.actor_email,
    summary: record.summary,
    oldValues: record.old_values,
    newValues: record.new_values,
    metadata: record.metadata,
    ipAddress: record.ip_address,
    userAgent: record.user_agent,
    createdAt: record.created_at,
  };
}

export async function getAdminAuditLogs(
  supabase: SupabaseClient,
  filters: AuditLogFilters,
): Promise<AuditLogListResult> {
  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  let query = supabase
    .from("audit_logs")
    .select(auditLogSelect, { count: "exact" })
    .gte("created_at", filters.dateFromIso)
    .lt("created_at", filters.dateToExclusiveIso)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.actorEmail) {
    query = query.ilike("actor_email", `%${filters.actorEmail}%`);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error("Unable to load audit logs.");
  }

  const totalCount = count ?? 0;

  return {
    rows: ((data as unknown as AuditLogRecord[] | null) ?? []).map(mapAuditLog),
    totalCount,
    page: filters.page,
    limit: filters.limit,
    pageCount: Math.max(1, Math.ceil(totalCount / filters.limit)),
  };
}

export async function getAdminAuditLogById(
  supabase: SupabaseClient,
  auditLogId: string,
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(auditLogSelect)
    .eq("id", auditLogId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load audit log.");
  }

  return data ? mapAuditLog(data as unknown as AuditLogRecord) : null;
}

