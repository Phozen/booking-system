import type { SupabaseClient } from "@supabase/supabase-js";

import type { MaintenanceStatus } from "@/lib/admin/maintenance/validation";
import type { FacilityType } from "@/lib/facilities/validation";

type MaintenanceFacilityRecord =
  | {
      id: string;
      code: string;
      name: string;
      level: string;
      type: FacilityType;
    }
  | {
      id: string;
      code: string;
      name: string;
      level: string;
      type: FacilityType;
    }[]
  | null;

type MaintenanceClosureRecord = {
  id: string;
  facility_id: string;
  title: string;
  reason: string | null;
  status: MaintenanceStatus;
  starts_at: string;
  ends_at: string;
  created_by: string | null;
  updated_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  facilities?: MaintenanceFacilityRecord;
};

export type MaintenanceClosure = {
  id: string;
  facilityId: string;
  title: string;
  reason: string | null;
  status: MaintenanceStatus;
  startsAt: string;
  endsAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  completedBy: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    code: string;
    name: string;
    level: string;
    type: FacilityType;
  } | null;
};

const maintenanceClosureSelect = `
  id,
  facility_id,
  title,
  reason,
  status,
  starts_at,
  ends_at,
  created_by,
  updated_by,
  completed_by,
  completed_at,
  created_at,
  updated_at,
  facilities (
    id,
    code,
    name,
    level,
    type
  )
`;

function mapMaintenanceClosure(
  record: MaintenanceClosureRecord,
): MaintenanceClosure {
  const facility = Array.isArray(record.facilities)
    ? record.facilities[0]
    : record.facilities;

  return {
    id: record.id,
    facilityId: record.facility_id,
    title: record.title,
    reason: record.reason,
    status: record.status,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    createdBy: record.created_by,
    updatedBy: record.updated_by,
    completedBy: record.completed_by,
    completedAt: record.completed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    facility: facility
      ? {
          id: facility.id,
          code: facility.code,
          name: facility.name,
          level: facility.level,
          type: facility.type,
        }
      : null,
  };
}

export async function getAdminMaintenanceClosures(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("maintenance_closures")
    .select(maintenanceClosureSelect)
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load maintenance closures.");
  }

  return ((data as unknown as MaintenanceClosureRecord[] | null) ?? []).map(
    mapMaintenanceClosure,
  );
}

export async function getAdminMaintenanceClosureById(
  supabase: SupabaseClient,
  maintenanceClosureId: string,
) {
  const { data, error } = await supabase
    .from("maintenance_closures")
    .select(maintenanceClosureSelect)
    .eq("id", maintenanceClosureId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load maintenance closure.");
  }

  return data
    ? mapMaintenanceClosure(data as unknown as MaintenanceClosureRecord)
    : null;
}
