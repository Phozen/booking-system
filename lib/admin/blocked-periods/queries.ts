import type { SupabaseClient } from "@supabase/supabase-js";

import type { BlockedPeriodScope } from "@/lib/admin/blocked-periods/validation";

type BlockedPeriodFacilityRecord = {
  facility_id: string;
  facilities:
    | {
        id: string;
        code: string;
        name: string;
        level: string;
      }
    | {
        id: string;
        code: string;
        name: string;
        level: string;
      }[]
    | null;
};

type BlockedPeriodRecord = {
  id: string;
  title: string;
  reason: string | null;
  scope: BlockedPeriodScope;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  blocked_period_facilities?: BlockedPeriodFacilityRecord[] | null;
};

export type BlockedPeriod = {
  id: string;
  title: string;
  reason: string | null;
  scope: BlockedPeriodScope;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  facilities: {
    id: string;
    code: string;
    name: string;
    level: string;
  }[];
};

const blockedPeriodSelect = `
  id,
  title,
  reason,
  scope,
  starts_at,
  ends_at,
  is_active,
  created_by,
  updated_by,
  created_at,
  updated_at,
  blocked_period_facilities (
    facility_id,
    facilities (
      id,
      code,
      name,
      level
    )
  )
`;

function mapBlockedPeriod(record: BlockedPeriodRecord): BlockedPeriod {
  const facilities = (record.blocked_period_facilities ?? [])
    .map((item) => {
      const facility = Array.isArray(item.facilities)
        ? item.facilities[0]
        : item.facilities;

      if (!facility) {
        return null;
      }

      return {
        id: facility.id,
        code: facility.code,
        name: facility.name,
        level: facility.level,
      };
    })
    .filter((item): item is BlockedPeriod["facilities"][number] =>
      Boolean(item),
    )
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    id: record.id,
    title: record.title,
    reason: record.reason,
    scope: record.scope,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    isActive: record.is_active,
    createdBy: record.created_by,
    updatedBy: record.updated_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    facilities,
  };
}

export async function getAdminBlockedPeriods(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("blocked_periods")
    .select(blockedPeriodSelect)
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load blocked periods.");
  }

  return ((data as unknown as BlockedPeriodRecord[] | null) ?? []).map(
    mapBlockedPeriod,
  );
}

export async function getAdminBlockedPeriodById(
  supabase: SupabaseClient,
  blockedPeriodId: string,
) {
  const { data, error } = await supabase
    .from("blocked_periods")
    .select(blockedPeriodSelect)
    .eq("id", blockedPeriodId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load blocked period.");
  }

  return data ? mapBlockedPeriod(data as unknown as BlockedPeriodRecord) : null;
}
