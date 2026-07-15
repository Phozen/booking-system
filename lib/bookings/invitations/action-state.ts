export type InvitationActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

export type InvitationBatchFailure = {
  userId: string;
  message: string;
};

export type InvitationBatchActionResult = InvitationActionResult & {
  invitedUserIds: string[];
  failures: InvitationBatchFailure[];
};

export const invitationActionInitialState: InvitationActionResult = {
  status: "idle",
  message: "",
};

export const invitationBatchActionInitialState: InvitationBatchActionResult = {
  status: "idle",
  message: "",
  invitedUserIds: [],
  failures: [],
};
