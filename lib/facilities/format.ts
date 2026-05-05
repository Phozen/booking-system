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
