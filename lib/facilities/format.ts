import type { FacilityStatus, FacilityType } from "@/lib/facilities/validation";

export function formatFacilityType(type: FacilityType) {
  return type === "event_hall" ? "Event Hall" : "Meeting Room";
}

export function formatFacilityStatus(status: FacilityStatus) {
  const labels: Record<FacilityStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    under_maintenance: "Under Maintenance",
    archived: "Archived",
  };

  return labels[status];
}

export function formatRequiresApproval(value: boolean | null) {
  if (value === true) {
    return "Required";
  }

  if (value === false) {
    return "Not required";
  }

  return "Uses system default";
}

export function buildFacilitySlug(name: string, fallback = "facility") {
  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 140);

  const fromName = slugify(name);
  if (fromName.length >= 2) {
    return fromName;
  }

  const fromFallback = slugify(fallback);
  return fromFallback.length >= 2 ? fromFallback : "facility";
}
