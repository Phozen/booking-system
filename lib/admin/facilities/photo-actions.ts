"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { createAuditLogSafely } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/guards";
import {
  buildFacilityPhotoStoragePath,
  facilityPhotoAltTextSchema,
  facilityPhotoBucket,
  facilityPhotoFacilityIdSchema,
  facilityPhotoIdSchema,
  validateFacilityPhotoFile,
} from "@/lib/admin/facilities/photo-validation";
import type { FacilityPhotoActionResult } from "@/lib/admin/facilities/photo-action-state";
import { getAdminFacilityById, type Facility, type FacilityPhoto } from "@/lib/facilities/queries";
import { createAdminClient } from "@/lib/supabase/admin";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

async function getFacilityForPhotoAction(facilityId: string) {
  const supabase = createAdminClient();
  const facility = await getAdminFacilityById(supabase, facilityId);

  return { supabase, facility };
}

function revalidateFacilityPhotoPaths(facility: Pick<Facility, "id" | "slug">) {
  revalidatePath("/facilities");
  revalidatePath(`/facilities/${facility.slug}`);
  revalidatePath("/admin/facilities");
  revalidatePath(`/admin/facilities/${facility.id}`);
}

function buildPhotoAuditValues(photo: FacilityPhoto) {
  return {
    id: photo.id,
    storagePath: photo.storagePath,
    storageBucket: photo.storageBucket,
    altText: photo.altText,
    isPrimary: photo.isPrimary,
    displayOrder: photo.displayOrder,
  };
}

export async function uploadFacilityPhotoAction(
  _previousState: FacilityPhotoActionResult,
  formData: FormData,
): Promise<FacilityPhotoActionResult> {
  const { user } = await requireAdmin();
  const facilityId = getStringValue(formData, "facilityId");
  const parsedFacilityId = facilityPhotoFacilityIdSchema.safeParse(facilityId);

  if (!parsedFacilityId.success) {
    return {
      status: "error",
      message: "Facility could not be found.",
    };
  }

  const photo = formData.get("photo");

  if (!(photo instanceof File)) {
    return {
      status: "error",
      message: "Choose an image file to upload.",
    };
  }

  const fileValidation = validateFacilityPhotoFile(photo);

  if (!fileValidation.valid) {
    return {
      status: "error",
      message: fileValidation.message,
    };
  }

  const parsedAltText = facilityPhotoAltTextSchema.safeParse(
    getStringValue(formData, "altText") || undefined,
  );

  if (!parsedAltText.success) {
    return {
      status: "error",
      message: "Alt text must be 160 characters or fewer.",
    };
  }

  const { supabase, facility } = await getFacilityForPhotoAction(parsedFacilityId.data);

  if (!facility) {
    return {
      status: "error",
      message: "Facility could not be found.",
    };
  }

  const hasPrimaryPhoto = facility.photos.some((item) => item.isPrimary);
  const isPrimary = !hasPrimaryPhoto;
  const storagePath = buildFacilityPhotoStoragePath({
    facilityId: facility.id,
    fileName: photo.name,
    mimeType: photo.type,
    uniqueId: randomUUID(),
    timestamp: Date.now(),
  });

  const { error: uploadError } = await supabase.storage
    .from(facilityPhotoBucket)
    .upload(storagePath, photo, {
      cacheControl: "3600",
      contentType: photo.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Facility photo upload failed", {
      facilityId: facility.id,
      code: uploadError.name,
      message: uploadError.message,
    });

    return {
      status: "error",
      message: "Photo could not be uploaded. Check the file and try again.",
    };
  }

  const altText = parsedAltText.data || `${facility.name} photo`;
  const { data: insertedPhoto, error: insertError } = await supabase
    .from("facility_photos")
    .insert({
      facility_id: facility.id,
      storage_bucket: facilityPhotoBucket,
      storage_path: storagePath,
      public_url: null,
      alt_text: altText,
      is_primary: isPrimary,
      display_order: facility.photos.length,
      uploaded_by: user.id,
    })
    .select(
      "id, storage_bucket, storage_path, public_url, alt_text, is_primary, display_order",
    )
    .single();

  if (insertError || !insertedPhoto) {
    await supabase.storage.from(facilityPhotoBucket).remove([storagePath]);

    console.error("Facility photo record insert failed", {
      facilityId: facility.id,
      code: insertError?.code,
      message: insertError?.message,
    });

    return {
      status: "error",
      message: "Photo uploaded but could not be saved. Please try again.",
    };
  }

  await createAuditLogSafely(
    supabase,
    {
      action: "create",
      entityType: "facility",
      entityId: facility.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Uploaded a photo for facility ${facility.code}.`,
      newValues: {
        photoId: insertedPhoto.id,
        storagePath,
        altText,
        isPrimary,
      },
      metadata: {
        photoId: insertedPhoto.id,
        storagePath,
      },
    },
    { facilityId: facility.id, photoId: insertedPhoto.id },
  );

  revalidateFacilityPhotoPaths(facility);

  return {
    status: "success",
    message: isPrimary
      ? "Photo uploaded and set as the primary facility photo."
      : "Photo uploaded. You can set it as primary if it should appear first.",
  };
}

export async function setFacilityPhotoPrimaryAction(
  _previousState: FacilityPhotoActionResult,
  formData: FormData,
): Promise<FacilityPhotoActionResult> {
  const { user } = await requireAdmin();
  const parsedFacilityId = facilityPhotoFacilityIdSchema.safeParse(
    getStringValue(formData, "facilityId"),
  );
  const parsedPhotoId = facilityPhotoIdSchema.safeParse(
    getStringValue(formData, "photoId"),
  );

  if (!parsedFacilityId.success || !parsedPhotoId.success) {
    return {
      status: "error",
      message: "Photo could not be found.",
    };
  }

  const { supabase, facility } = await getFacilityForPhotoAction(parsedFacilityId.data);

  if (!facility) {
    return {
      status: "error",
      message: "Facility could not be found.",
    };
  }

  const selectedPhoto = facility.photos.find((photo) => photo.id === parsedPhotoId.data);

  if (!selectedPhoto) {
    return {
      status: "error",
      message: "Photo could not be found for this facility.",
    };
  }

  if (selectedPhoto.isPrimary) {
    return {
      status: "success",
      message: "This photo is already the primary facility photo.",
    };
  }

  const { error: unsetError } = await supabase
    .from("facility_photos")
    .update({ is_primary: false })
    .eq("facility_id", facility.id);

  if (unsetError) {
    console.error("Facility photo primary unset failed", {
      facilityId: facility.id,
      code: unsetError.code,
      message: unsetError.message,
    });

    return {
      status: "error",
      message: "Primary photo could not be updated. Please try again.",
    };
  }

  const { error: setError } = await supabase
    .from("facility_photos")
    .update({ is_primary: true })
    .eq("facility_id", facility.id)
    .eq("id", selectedPhoto.id);

  if (setError) {
    console.error("Facility photo primary set failed", {
      facilityId: facility.id,
      photoId: selectedPhoto.id,
      code: setError.code,
      message: setError.message,
    });

    return {
      status: "error",
      message: "Primary photo could not be updated. Please try again.",
    };
  }

  await createAuditLogSafely(
    supabase,
    {
      action: "update",
      entityType: "facility",
      entityId: facility.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Set a primary photo for facility ${facility.code}.`,
      oldValues: {
        primaryPhotoId: facility.photos.find((photo) => photo.isPrimary)?.id ?? null,
      },
      newValues: {
        primaryPhotoId: selectedPhoto.id,
      },
      metadata: {
        photoId: selectedPhoto.id,
        storagePath: selectedPhoto.storagePath,
      },
    },
    { facilityId: facility.id, photoId: selectedPhoto.id },
  );

  revalidateFacilityPhotoPaths(facility);

  return {
    status: "success",
    message: "Primary photo updated. Employee facility pages now use this image first.",
  };
}

export async function deleteFacilityPhotoAction(
  _previousState: FacilityPhotoActionResult,
  formData: FormData,
): Promise<FacilityPhotoActionResult> {
  const { user } = await requireAdmin();
  const parsedFacilityId = facilityPhotoFacilityIdSchema.safeParse(
    getStringValue(formData, "facilityId"),
  );
  const parsedPhotoId = facilityPhotoIdSchema.safeParse(
    getStringValue(formData, "photoId"),
  );

  if (!parsedFacilityId.success || !parsedPhotoId.success) {
    return {
      status: "error",
      message: "Photo could not be found.",
    };
  }

  const { supabase, facility } = await getFacilityForPhotoAction(parsedFacilityId.data);

  if (!facility) {
    return {
      status: "error",
      message: "Facility could not be found.",
    };
  }

  const selectedPhoto = facility.photos.find((photo) => photo.id === parsedPhotoId.data);

  if (!selectedPhoto) {
    return {
      status: "error",
      message: "Photo could not be found for this facility.",
    };
  }

  const { error: storageError } = await supabase.storage
    .from(selectedPhoto.storageBucket)
    .remove([selectedPhoto.storagePath]);

  if (storageError) {
    console.error("Facility photo storage delete failed", {
      facilityId: facility.id,
      photoId: selectedPhoto.id,
      code: storageError.name,
      message: storageError.message,
    });

    return {
      status: "error",
      message: "Photo could not be removed from storage. Please try again.",
    };
  }

  const { error: deleteError } = await supabase
    .from("facility_photos")
    .delete()
    .eq("facility_id", facility.id)
    .eq("id", selectedPhoto.id);

  if (deleteError) {
    console.error("Facility photo record delete failed", {
      facilityId: facility.id,
      photoId: selectedPhoto.id,
      code: deleteError.code,
      message: deleteError.message,
    });

    return {
      status: "error",
      message: "Photo could not be removed. Please try again.",
    };
  }

  const remainingPhotos = facility.photos
    .filter((photo) => photo.id !== selectedPhoto.id)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const nextPrimary = selectedPhoto.isPrimary ? remainingPhotos[0] : null;

  if (nextPrimary) {
    const { error: nextPrimaryError } = await supabase
      .from("facility_photos")
      .update({ is_primary: true })
      .eq("facility_id", facility.id)
      .eq("id", nextPrimary.id);

    if (nextPrimaryError) {
      console.error("Facility photo fallback primary set failed", {
        facilityId: facility.id,
        photoId: nextPrimary.id,
        code: nextPrimaryError.code,
        message: nextPrimaryError.message,
      });
    }
  }

  await createAuditLogSafely(
    supabase,
    {
      action: "delete",
      entityType: "facility",
      entityId: facility.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Removed a photo from facility ${facility.code}.`,
      oldValues: buildPhotoAuditValues(selectedPhoto),
      newValues: nextPrimary ? { primaryPhotoId: nextPrimary.id } : null,
      metadata: {
        photoId: selectedPhoto.id,
        storagePath: selectedPhoto.storagePath,
        replacementPrimaryPhotoId: nextPrimary?.id ?? null,
      },
    },
    { facilityId: facility.id, photoId: selectedPhoto.id },
  );

  revalidateFacilityPhotoPaths(facility);

  return {
    status: "success",
    message: nextPrimary
      ? "Photo removed. Another facility photo was set as primary."
      : "Photo removed. The facility will use the placeholder until another photo is uploaded.",
  };
}
