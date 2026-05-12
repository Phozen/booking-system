export type FacilityPhotoActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

export const facilityPhotoActionInitialState: FacilityPhotoActionResult = {
  status: "idle",
  message: "",
};
