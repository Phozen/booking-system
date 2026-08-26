import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("booking form first-load wiring", () => {
  it("signs room photos in one storage call per bucket", () => {
    const queries = read("lib/facilities/queries.ts");

    expect(queries).toContain("createSignedUrls");
    expect(queries).not.toContain("createSignedUrl(");
  });

  it("caches the bookable room list and refreshes it when rooms change", () => {
    const bookingQueries = read("lib/bookings/queries.ts");
    const facilityActions = read("lib/facilities/actions.ts");
    const photoActions = read("lib/admin/facilities/photo-actions.ts");

    expect(bookingQueries).toContain("unstable_cache");
    expect(bookingQueries).toContain("photos.slice(0, 1)");
    expect(facilityActions).toContain("revalidateBookableFacilitiesCache");
    expect(photoActions).toContain("revalidateBookableFacilitiesCache");
  });

  it("shows the booking shell before rooms finish loading", () => {
    const page = read("app/(app)/bookings/new/page.tsx");
    const loading = read("app/(app)/bookings/new/loading.tsx");

    expect(page).toContain("BookingFormSkeleton");
    expect(page).toContain("Suspense");
    expect(loading).toContain("BookingFormSkeleton");
  });

  it("lazy-loads room photos instead of CSS background images", () => {
    const photo = read("components/facilities/facility-photo.tsx");

    expect(photo).toContain("<img");
    expect(photo).toContain('loading={priority ? "eager" : "lazy"}');
    expect(photo).not.toContain("backgroundImage");
  });
});
