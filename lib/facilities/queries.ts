import type { SupabaseClient } from "@supabase/supabase-js";

import type { FacilityStatus, FacilityType } from "@/lib/facilities/validation";

type FacilityPhotoRecord = {
  id: string;
  storage_bucket: string;
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
  storageBucket: string;
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
    storage_bucket,
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
      storageBucket: photo.storage_bucket,
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

async function addSignedPhotoUrls(
  supabase: SupabaseClient,
  facilities: Facility[],
) {
  return Promise.all(
    facilities.map(async (facility) => {
      const photos = await Promise.all(
        facility.photos.map(async (photo) => {
          if (photo.publicUrl) {
            return photo;
          }

          const { data, error } = await supabase.storage
            .from(photo.storageBucket)
            .createSignedUrl(photo.storagePath, 60 * 60);

          if (error || !data?.signedUrl) {
            return photo;
          }

          return {
            ...photo,
            publicUrl: data.signedUrl,
          };
        }),
      );

      return {
        ...facility,
        photos,
      };
    }),
  );
}

export async function getEmployeeFacilities(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("facilities")
    .select(facilitySelect)
    .eq("status", "active")
    .eq("is_archived", false)
    .order("level", { ascending: true })
    .order("type", { ascending: true })
    .order("name", { ascending: true })
    .order("code", { ascending: true });

  if (error) {
    throw new Error("Unable to load facilities.");
  }

  return addSignedPhotoUrls(
    supabase,
    ((data as unknown as FacilityRecord[] | null) ?? []).map(mapFacility),
  );
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

  if (!data) {
    return null;
  }

  const [facility] = await addSignedPhotoUrls(supabase, [
    mapFacility(data as unknown as FacilityRecord),
  ]);

  return facility;
}

export async function getAdminFacilities(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("facilities")
    .select(facilitySelect)
    .order("level", { ascending: true })
    .order("type", { ascending: true })
    .order("name", { ascending: true })
    .order("code", { ascending: true });

  if (error) {
    throw new Error("Unable to load facilities.");
  }

  return addSignedPhotoUrls(
    supabase,
    ((data as unknown as FacilityRecord[] | null) ?? []).map(mapFacility),
  );
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

  if (!data) {
    return null;
  }

  const [facility] = await addSignedPhotoUrls(supabase, [
    mapFacility(data as unknown as FacilityRecord),
  ]);

  return facility;
}
