import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type EquipmentItem = {
  id: string;
  name: string;
  description: string | null;
  iconName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type EquipmentRecord = {
  id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapEquipment(record: EquipmentRecord): EquipmentItem {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    iconName: record.icon_name,
    isActive: record.is_active,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function getEquipmentItems(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("equipment")
    .select("id,name,description,icon_name,is_active,created_at,updated_at")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load equipment.");
  }

  return ((data as EquipmentRecord[] | null) ?? []).map(mapEquipment);
}
