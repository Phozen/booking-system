export type FacilityActionResult = {
  status: "idle" | "error" | "success";
  message: string;
  facilityId?: string;
};
