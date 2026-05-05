import type { SupabaseClient } from "@supabase/supabase-js";

import type { FacilityStatus, FacilityType } from "@/lib/facilities/validation";

type FacilityPhotoRecord = {
  id: string;
  public_url: string | null;
  storage_path: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
};

type FacilityEquipmentRecord = {
  quantity: number;
  notes: string | null;
  equipment:
    | {
        id: string;
        name: string;
        description: string | null;
        icon_name: string | null;
      }
    | {
        id: string;
        name: string;
        description: string | null;
        icon_name: string | null;
      }[]
    | null;
};

type FacilityRecord = {
  id: string;
  code: string;
  name: string;
  slug: string;
  level: string;
  type: FacilityType;
  capacity: number;
  description: string | null;
  status: FacilityStatus;
  requires_approval: boolean | null;
  display_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  facility_photos?: FacilityPhotoRecord[] | null;
  facility_equipment?: FacilityEquipmentRecord[] | null;
};

export type FacilityPhoto = {
  id: string;
  publicUrl: string | null;
  storagePath: string;
  altText: string | null;
  isPrimary: boolean;
  displayOrder: number;
};

export type FacilityEquipment = {
  id: string;
  name: string;
  description: string | null;
  iconName: string | null;
  quantity: number;
  notes: string | null;
};

export type Facility = {
  id: string;
  code: string;
  name: string;
  slug: string;
  level: string;
  type: FacilityType;
  capacity: number;
  description: string | null;
  status: FacilityStatus;
  requiresApproval: boolean | null;
  displayOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  photos: FacilityPhoto[];
  equipment: FacilityEquipment[];
};

const facilitySelect = `
  id,
  code,
  name,
  slug,
  level,
  type,
  capacity,
  description,
  status,
  requires_approval,
  display_order,
  is_archived,
  created_at,
  updated_at,
  facility_photos (
    id,
    public_url,
    storage_path,
    alt_text,
    is_primary,
    display_order
  ),
  facility_equipment (
    quantity,
    notes,
    equipment (
      id,
      name,
      description,
      icon_name
    )
  )
`;

function mapFacility(record: FacilityRecord): Facility {
  const photos = [...(record.facility_photos ?? [])]
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) {
        return a.is_primary ? -1 : 1;
      }

      return a.display_order - b.display_order;
    })
    .map((photo) => ({
      id: photo.id,
      publicUrl: photo.public_url,
      storagePath: photo.storage_path,
      altText: photo.alt_text,
      isPrimary: photo.is_primary,
      displayOrder: photo.display_order,
    }));

  const equipment = (record.facility_equipment ?? [])
    .map((item) => {
      const equipmentRecord = Array.isArray(item.equipment)
        ? item.equipment[0]
        : item.equipment;

      if (!equipmentRecord) {
        return null;
      }

      return {
        id: equipmentRecord.id,
        name: equipmentRecord.name,
        description: equipmentRecord.description,
        iconName: equipmentRecord.icon_name,
        quantity: item.quantity,
        notes: item.notes,
      };
    })
    .filter((item): item is FacilityEquipment => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    id: record.id,
    code: record.code,
    name: record.name,
    slug: record.slug,
    level: record.level,
    type: record.type,
    capacity: record.capacity,
    description: record.description,
    status: record.status,
    requiresApproval: record.requires_approval,
    displayOrder: record.display_order,
    isArchived: record.is_archived,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    photos,
    equipment,
  };
}

export async function getEmployeeFacilities(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("facilities")
    .select(facilitySelect)
    .eq("status", "active")
    .eq("is_archived", false)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load facilities.");
  }

  return ((data as unknown as FacilityRecord[] | null) ?? []).map(mapFacility);
}

export async function getEmployeeFacilityBySlug(
  supabase: SupabaseClient,
  slug: string,
) {
  const { data, error } = await supabase
    .from("facilities")
    .select(facilitySelect)
    .eq("slug", slug)
    .eq("status", "active")
    .eq("is_archived", false)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load facility.");
  }

  return data ? mapFacility(data as unknown as FacilityRecord) : null;
}

export async function getAdminFacilities(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("facilities")
    .select(facilitySelect)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load facilities.");
  }

  return ((data as unknown as FacilityRecord[] | null) ?? []).map(mapFacility);
}

export async function getAdminFacilityById(
  supabase: SupabaseClient,
  id: string,
) {
  const { data, error } = await supabase
    .from("facilities")
    .select(facilitySelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load facility.");
  }

  return data ? mapFacility(data as unknown as FacilityRecord) : null;
}
