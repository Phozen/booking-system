export type ProfileActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

export const profileActionInitialState: ProfileActionResult = {
  status: "idle",
  message: "",
};
