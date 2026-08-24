import { describe, expect, it } from "vitest";

import {
  canInviteUser,
  canManageBookingInvitations,
  getInvitationContextLabel,
  getInvitationStatusLabel,
  invitationManagementLockedMessage,
  invitationResponseLockedMessage,
  inviteUserSchema,
  inviteUsersSchema,
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

  it("accepts a bounded batch of invitation targets", () => {
    expect(
      inviteUsersSchema.safeParse({
        bookingId,
        invitedUserIds: [userId],
      }).success,
    ).toBe(true);

    expect(
      inviteUsersSchema.safeParse({
        bookingId,
        invitedUserIds: [],
      }).success,
    ).toBe(false);

    expect(
      inviteUsersSchema.safeParse({
        bookingId,
        invitedUserIds: Array.from({ length: 51 }, () => userId),
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

  it("allows self-invite but blocks inactive and duplicate invitations", () => {
    expect(
      canInviteUser({
        ownerUserId: userId,
        invitedUserId: userId,
        invitedUserStatus: "active",
      }).allowed,
    ).toBe(true);

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

  it("allows participant changes only on pending or confirmed bookings", () => {
    expect(canManageBookingInvitations("pending")).toBe(true);
    expect(canManageBookingInvitations("confirmed")).toBe(true);
    expect(canManageBookingInvitations("cancelled")).toBe(false);
    expect(canManageBookingInvitations("rejected")).toBe(false);
    expect(canManageBookingInvitations("completed")).toBe(false);
    expect(canManageBookingInvitations("expired")).toBe(false);
    expect(invitationManagementLockedMessage).toContain("pending or confirmed");
    expect(invitationResponseLockedMessage).toContain("pending or confirmed");
  });
});
