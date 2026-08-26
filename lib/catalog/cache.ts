import { revalidatePath, revalidateTag } from "next/cache";

export const BOOKABLE_FACILITIES_CACHE_TAG = "bookable-facilities";
export const DEPARTMENTS_CACHE_TAG = "departments";

export function revalidateBookableFacilitiesCache() {
  revalidateTag(BOOKABLE_FACILITIES_CACHE_TAG, "max");
  revalidatePath("/bookings/new");
}

export function revalidateDepartmentsCache() {
  revalidateTag(DEPARTMENTS_CACHE_TAG, "max");
  revalidatePath("/bookings/new");
}
