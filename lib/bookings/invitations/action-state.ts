export type InvitationActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

export const invitationActionInitialState: InvitationActionResult = {
  status: "idle",
  message: "",
};
