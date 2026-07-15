import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { searchInviteCandidatesForBooking } from "@/lib/bookings/invitations/queries";

const bookingId = "11111111-1111-4111-8111-111111111111";
const ownerUserId = "22222222-2222-4222-8222-222222222222";

function createSearchClient({ canManage = true }: { canManage?: boolean } = {}) {
  const bookingQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  bookingQuery.select.mockReturnValue(bookingQuery);
  bookingQuery.eq.mockReturnValue(bookingQuery);
  bookingQuery.maybeSingle.mockResolvedValue({
    data: canManage ? { id: bookingId } : null,
    error: null,
  });

  const profileQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  profileQuery.select.mockReturnValue(profileQuery);
  profileQuery.eq.mockReturnValue(profileQuery);
  profileQuery.neq.mockReturnValue(profileQuery);
  profileQuery.or.mockReturnValue(profileQuery);
  profileQuery.order.mockReturnValue(profileQuery);
  profileQuery.limit.mockResolvedValue({
    data: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        email: "alex@example.com",
        full_name: "Alex Tan",
        department: "Operations",
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        email: "alex.invited@example.com",
        full_name: "Alex Invited",
        department: "Operations",
      },
    ],
    error: null,
  });

  const invitationQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
  };
  invitationQuery.select.mockReturnValue(invitationQuery);
  invitationQuery.eq.mockReturnValue(invitationQuery);
  invitationQuery.in.mockResolvedValue({
    data: [
      { invited_user_id: "44444444-4444-4444-8444-444444444444" },
    ],
    error: null,
  });

  const client = {
    from: vi.fn((table: string) => {
      if (table === "bookings") return bookingQuery;
      if (table === "profiles") return profileQuery;
      if (table === "booking_invitations") return invitationQuery;
      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return { client, profileQuery };
}

describe("invitation candidate search", () => {
  it("returns minimal matching profiles and excludes existing invitations", async () => {
    const { client, profileQuery } = createSearchClient();

    const result = await searchInviteCandidatesForBooking(
      client as never,
      bookingId,
      ownerUserId,
      "Alex, (Operations)",
    );

    expect(result).toEqual([
      {
        id: "33333333-3333-4333-8333-333333333333",
        email: "alex@example.com",
        fullName: "Alex Tan",
        department: "Operations",
      },
    ]);
    expect(profileQuery.or).toHaveBeenCalledWith(
      "full_name.ilike.%Alex Operations%,email.ilike.%Alex Operations%,department.ilike.%Alex Operations%",
    );
  });

  it("does not search the directory when the user does not own the booking", async () => {
    const { client, profileQuery } = createSearchClient({ canManage: false });

    const result = await searchInviteCandidatesForBooking(
      client as never,
      bookingId,
      ownerUserId,
      "Alex",
    );

    expect(result).toBeNull();
    expect(profileQuery.select).not.toHaveBeenCalled();
  });
});
