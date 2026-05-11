import { z } from "zod";

export const facilityPhotoBucket = "facility-photos";
export const facilityPhotoMaxBytes = 5 * 1024 * 1024;
export const facilityPhotoAllowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const extensionByMimeType: Record<(typeof facilityPhotoAllowedTypes)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const facilityPhotoIdSchema = z.uuid("Photo could not be found.");
export const facilityPhotoFacilityIdSchema = z.uuid("Facility could not be found.");
export const facilityPhotoAltTextSchema = z
  .string()
  .trim()
  .max(160, "Alt text must be 160 characters or fewer.")
  .optional();

export type FacilityPhotoValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export function validateFacilityPhotoFile(file: File): FacilityPhotoValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      message: "Choose an image file to upload.",
    };
  }

  if (!facilityPhotoAllowedTypes.includes(file.type as (typeof facilityPhotoAllowedTypes)[number])) {
    return {
      valid: false,
      message: "Upload a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size > facilityPhotoMaxBytes) {
    return {
      valid: false,
      message: "Upload an image that is 5 MB or smaller.",
    };
  }

  return { valid: true };
}

export function sanitizeFacilityPhotoFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const sanitized = baseName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);

  return sanitized || "facility-photo";
}

export function getFacilityPhotoExtension(mimeType: string) {
  return extensionByMimeType[mimeType as (typeof facilityPhotoAllowedTypes)[number]] ?? "jpg";
}

export function buildFacilityPhotoStoragePath({
  facilityId,
  fileName,
  mimeType,
  uniqueId,
  timestamp,
}: {
  facilityId: string;
  fileName: string;
  mimeType: string;
  uniqueId: string;
  timestamp: number;
}) {
  const safeName = sanitizeFacilityPhotoFileName(fileName);
  const extension = getFacilityPhotoExtension(mimeType);

  return `facilities/${facilityId}/${timestamp}-${uniqueId}-${safeName}.${extension}`;
}

