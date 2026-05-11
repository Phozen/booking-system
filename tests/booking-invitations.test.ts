import { describe, expect, it } from "vitest";

import {
  canInviteUser,
  getInvitationContextLabel,
  getInvitationStatusLabel,
  inviteUserSchema,
  invitationResponseSchema,
} from "@/lib/bookings/invitations/validation";

const bookingId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

describe("booking invitation validation", () => {
  it("validates invite payloads", () => {
    expect(
      inviteUserSchema.safeParse({
        bookingId,
        invitedUserId: userId,
      }).success,
    ).toBe(true);

    expect(
      inviteUserSchema.safeParse({
        bookingId: "not-a-uuid",
        invitedUserId: userId,
      }).success,
    ).toBe(false);
  });

  it("validates invitation responses", () => {
    expect(
      invitationResponseSchema.safeParse({
        invitationId: bookingId,
        status: "accepted",
        responseMessage: "See you there.",
      }).success,
    ).toBe(true);

    expect(
      invitationResponseSchema.safeParse({
        invitationId: bookingId,
        status: "removed",
      }).success,
    ).toBe(false);
  });

  it("blocks self, inactive, and duplicate invitations", () => {
    expect(
      canInviteUser({
        ownerUserId: userId,
        invitedUserId: userId,
        invitedUserStatus: "active",
      }).allowed,
    ).toBe(false);

    expect(
      canInviteUser({
        ownerUserId: bookingId,
        invitedUserId: userId,
        invitedUserStatus: "disabled",
      }).allowed,
    ).toBe(false);

    expect(
      canInviteUser({
        ownerUserId: bookingId,
        invitedUserId: userId,
        invitedUserStatus: "active",
        existingInvitation: { status: "pending" },
      }).allowed,
    ).toBe(false);
  });

  it("formats invitation labels", () => {
    expect(getInvitationStatusLabel("accepted")).toBe("Accepted");
    expect(getInvitationContextLabel("pending")).toBe("Pending invitation");
  });
});
