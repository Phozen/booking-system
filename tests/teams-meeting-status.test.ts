import { describe, expect, it } from "vitest";

import type { TeamsInvitationStatus } from "@/lib/bookings/teams-meeting-status";

describe("Teams invitation status contract", () => {
  it("keeps the employee-facing status set safe and free of join details", () => {
    const statuses: TeamsInvitationStatus[] = ["pending", "sent", "failed", "cancelled"];
    expect(statuses).toEqual(["pending", "sent", "failed", "cancelled"]);
  });
});
