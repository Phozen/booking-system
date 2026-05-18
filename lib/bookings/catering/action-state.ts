export type CateringActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

export const cateringActionInitialState: CateringActionResult = {
  status: "idle",
  message: "",
};
