import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  booking: { user_id: "owner-1", teams_meeting: true } as {
    user_id: string;
    teams_meeting: boolean;
  } | null,
  invitation: { id: "invitation-1" } as { id: string } | null,
  sync: { external_event_id: "event-1", sync_status: "synced" } as {
    external_event_id: string | null;
    sync_status: string;
  } | null,
  graphResult: {
    ok: true,
    data: { onlineMeeting: { joinUrl: "https://teams.microsoft.com/l/meetup-join/example" } },
  } as { ok: true; data: unknown } | { ok: false; error: string },
}));

const graphFetch = vi.hoisted(() => vi.fn());
const delegatedToken = vi.hoisted(() => vi.fn());

function query(data: unknown) {
  return {
    select: () => query(data),
    eq: () => query(data),
    in: () => query(data),
    maybeSingle: async () => ({ data }),
  };
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) =>
      query(
        table === "bookings"
          ? state.booking
          : table === "booking_invitations"
            ? state.invitation
            : state.sync,
      ),
  }),
}));
vi.mock("@/lib/integrations/microsoft-365-calendar/client", () => ({
  buildMicrosoftGraphPath: (...segments: string[]) => segments.join("/"),
  microsoftGraphFetchWithAccessToken: graphFetch,
}));
vi.mock("@/lib/integrations/microsoft-365-calendar/delegated", () => ({
  getMicrosoftDelegatedAccessToken: delegatedToken,
}));

import {
  getAuthorizedTeamsJoinUrl,
  type TeamsInvitationStatus,
} from "@/lib/bookings/teams-meeting-status";

describe("Teams invitation status contract", () => {
  beforeEach(() => {
    state.booking = { user_id: "owner-1", teams_meeting: true };
    state.invitation = { id: "invitation-1" };
    state.sync = { external_event_id: "event-1", sync_status: "synced" };
    state.graphResult = {
      ok: true,
      data: { onlineMeeting: { joinUrl: "https://teams.microsoft.com/l/meetup-join/example" } },
    };
    graphFetch.mockResolvedValue(state.graphResult);
    delegatedToken.mockResolvedValue({ ok: true, accessToken: "delegated-access-token" });
  });

  it("keeps the employee-facing status set safe and free of join details", () => {
    const statuses: TeamsInvitationStatus[] = ["pending", "sent", "failed", "cancelled"];
    expect(statuses).toEqual(["pending", "sent", "failed", "cancelled"]);
  });

  it("returns the live Graph join URL for the organiser after calendar sync", async () => {
    await expect(
      getAuthorizedTeamsJoinUrl({ bookingId: "booking-1", viewerUserId: "owner-1" }),
    ).resolves.toBe("https://teams.microsoft.com/l/meetup-join/example");
    expect(graphFetch).toHaveBeenCalledWith(
      "me/events/event-1?$select=onlineMeeting",
      "delegated-access-token",
    );
  });

  it("does not fetch a join URL for a user who is not invited", async () => {
    state.invitation = null;

    await expect(
      getAuthorizedTeamsJoinUrl({ bookingId: "booking-1", viewerUserId: "other-user" }),
    ).resolves.toBeNull();
    expect(graphFetch).not.toHaveBeenCalled();
  });

  it("rejects a non-HTTPS join URL returned by the provider", async () => {
    state.graphResult = {
      ok: true,
      data: { onlineMeeting: { joinUrl: "http://example.com/not-a-teams-link" } },
    };
    graphFetch.mockResolvedValue(state.graphResult);

    await expect(
      getAuthorizedTeamsJoinUrl({ bookingId: "booking-1", viewerUserId: "owner-1" }),
    ).resolves.toBeNull();
  });
});
