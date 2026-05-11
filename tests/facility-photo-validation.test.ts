import { describe, expect, it } from "vitest";

import {
  buildFacilityPhotoStoragePath,
  facilityPhotoMaxBytes,
  sanitizeFacilityPhotoFileName,
  validateFacilityPhotoFile,
} from "@/lib/admin/facilities/photo-validation";

describe("facility photo validation", () => {
  it("sanitizes file names for storage paths", () => {
    expect(sanitizeFacilityPhotoFileName("Main Boardroom (Level 5).PNG")).toBe(
      "main-boardroom-level-5",
    );
    expect(sanitizeFacilityPhotoFileName("...")).toBe("facility-photo");
  });

  it("builds stable facility photo storage paths", () => {
    const path = buildFacilityPhotoStoragePath({
      facilityId: "11111111-1111-1111-1111-111111111111",
      fileName: "Main Room!.webp",
      mimeType: "image/webp",
      uniqueId: "photo-id",
      timestamp: 123456,
    });

    expect(path).toBe(
      "facilities/11111111-1111-1111-1111-111111111111/123456-photo-id-main-room.webp",
    );
  });

  it("accepts supported image files within the app limit", () => {
    const file = new File(["image"], "room.jpg", { type: "image/jpeg" });

    expect(validateFacilityPhotoFile(file)).toEqual({ valid: true });
  });

  it("rejects unsupported file types", () => {
    const file = new File(["not image"], "room.txt", { type: "text/plain" });

    expect(validateFacilityPhotoFile(file)).toEqual({
      valid: false,
      message: "Upload a JPEG, PNG, or WebP image.",
    });
  });

  it("rejects images over the app limit", () => {
    const bytes = new Uint8Array(facilityPhotoMaxBytes + 1);
    const file = new File([bytes], "room.png", { type: "image/png" });

    expect(validateFacilityPhotoFile(file)).toEqual({
      valid: false,
      message: "Upload an image that is 5 MB or smaller.",
    });
  });
});

