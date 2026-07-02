import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createAdminClient: vi.fn(),
  createAuditLogSafely: vi.fn(),
  revalidatePath: vi.fn(),
  syncConfirmedBookingToMicrosoftCalendar: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/audit/log", () => ({
  createAuditLogSafely: mocks.createAuditLogSafely,
}));

vi.mock("@/lib/integrations/microsoft-365-calendar/sync", () => ({
  syncConfirmedBookingToMicrosoftCalendar:
    mocks.syncConfirmedBookingToMicrosoftCalendar,
}));

const {
  inviteUserToBookingAction,
  removeInvitationAction,
  respondToInvitationAction,
} = await import("@/lib/bookings/invitations/actions");

const owner = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.com",
};
const invitee = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "invitee@example.com",
  full_name: "Invitee User",
  status: "active",
};
const booking = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: owner.id,
  title: "Planning",
  status: "confirmed",
  starts_at: "2037-01-01T01:00:00.000Z",
  ends_at: "2037-01-01T02:00:00.000Z",
  facilities: { name: "Board Room", level: "Level 1" },
  profiles: { email: owner.email, full_name: "Owner User" },
};
const invitation = {
  id: "44444444-4444-4444-8444-444444444444",
  booking_id: booking.id,
  invited_user_id: invitee.id,
  invited_by: owner.id,
  status: "pending",
  response_message: null,
  responded_at: null,
};

function createInviteForm() {
  const formData = new FormData();
  formData.set("bookingId", booking.id);
  formData.set("invitedUserId", invitee.id);
  return formData;
}

function createResponseForm(message = "") {
  const formData = new FormData();
  formData.set("responseMessage", message);
  return formData;
}

function createQuery(result: unknown) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.single.mockResolvedValue(result);
  query.maybeSingle.mockResolvedValue(result);

  return query;
}

function setupAdminClient({
  bookingStatus = "confirmed",
  calendarSyncResult = { status: "synced", message: "ok" },
  includeExistingInvitationCheck = true,
}: {
  bookingStatus?: string;
  calendarSyncResult?: { status: string; message: string };
  includeExistingInvitationCheck?: boolean;
} = {}) {
  const bookingRecord = { ...booking, status: bookingStatus };
  const bookingQuery = createQuery({ data: bookingRecord, error: null });
  const inviteeQuery = createQuery({ data: invitee, error: null });
  const existingInvitationQuery = createQuery({ data: null, error: null });
  const insertedInvitationQuery = createQuery({
    data: invitation,
    error: null,
  });
  const invitationWithBookingQuery = createQuery({
    data: {
      ...invitation,
      bookings: bookingRecord,
      invited_user: invitee,
    },
    error: null,
  });
  const updatedInvitationQuery = createQuery({
    data: {
      id: invitation.id,
      status: "accepted",
      response_message: null,
      responded_at: "2037-01-01T00:00:00.000Z",
    },
    error: null,
  });
  const deleteInvitationQuery = createQuery({ error: null });
  const emailQuery = createQuery({ error: null });
  const queries = {
    bookingQuery,
    inviteeQuery,
    existingInvitationQuery,
    insertedInvitationQuery,
    invitationWithBookingQuery,
    updatedInvitationQuery,
    deleteInvitationQuery,
    emailQuery,
  };
  const bookingInvitationSelects: unknown[] = includeExistingInvitationCheck
    ? [existingInvitationQuery, invitationWithBookingQuery]
    : [invitationWithBookingQuery];

  const adminClient = {
    from: vi.fn((table: string) => {
      if (table === "bookings") {
        return bookingQuery;
      }

      if (table === "profiles") {
        return inviteeQuery;
      }

      if (table === "email_notifications") {
        return emailQuery;
      }

      if (table === "booking_invitations") {
        return {
          select: vi.fn(() => bookingInvitationSelects.shift()),
          insert: vi.fn(() => insertedInvitationQuery),
          update: vi.fn(() => updatedInvitationQuery),
          delete: vi.fn(() => deleteInvitationQuery),
        };
      }

      return createQuery({ data: null, error: null });
    }),
  };

  mocks.createAdminClient.mockReturnValue(adminClient);
  mocks.syncConfirmedBookingToMicrosoftCalendar.mockResolvedValue(
    calendarSyncResult,
  );

  return queries;
}

describe("booking invitation calendar attendee resync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ user: owner, profile: null });
    mocks.createAuditLogSafely.mockResolvedValue(undefined);
  });

  it("resyncs Microsoft Graph attendees after creating an invitation for a confirmed booking", async () => {
    setupAdminClient();

    const result = await inviteUserToBookingAction(
      { status: "idle", message: "" },
      createInviteForm(),
    );

    expect(result.status).toBe("success");
    expect(mocks.syncConfirmedBookingToMicrosoftCalendar).toHaveBeenCalledWith(
      booking.id,
      {
        userId: owner.id,
        email: owner.email,
        reason: "invitation_created",
      },
    );
  });

  it("does not resync attendees when the booking is still pending", async () => {
    setupAdminClient({ bookingStatus: "pending" });

    const result = await inviteUserToBookingAction(
      { status: "idle", message: "" },
      createInviteForm(),
    );

    expect(result.status).toBe("success");
    expect(mocks.syncConfirmedBookingToMicrosoftCalendar).not.toHaveBeenCalled();
  });

  it("does not fail invitation creation when calendar resync fails", async () => {
    setupAdminClient({
      calendarSyncResult: {
        status: "failed",
        message: "Graph unavailable",
      },
    });

    const result = await inviteUserToBookingAction(
      { status: "idle", message: "" },
      createInviteForm(),
    );

    expect(result.status).toBe("success");
    expect(mocks.syncConfirmedBookingToMicrosoftCalendar).toHaveBeenCalled();
  });

  it("resyncs attendees after accepting an invitation for a confirmed booking", async () => {
    setupAdminClient({ includeExistingInvitationCheck: false });
    mocks.requireUser.mockResolvedValue({
      user: { id: invitee.id, email: invitee.email },
      profile: null,
    });

    const result = await respondToInvitationAction(
      invitation.id,
      "accepted",
      { status: "idle", message: "" },
      createResponseForm(),
    );

    expect(result.status).toBe("success");
    expect(mocks.syncConfirmedBookingToMicrosoftCalendar).toHaveBeenCalledWith(
      booking.id,
      {
        userId: invitee.id,
        email: invitee.email,
        reason: "invitation_accepted",
      },
    );
  });

  it("resyncs attendees after removing an invitation for a confirmed booking", async () => {
    setupAdminClient({ includeExistingInvitationCheck: false });

    const result = await removeInvitationAction(invitation.id, {
      status: "idle",
      message: "",
    });

    expect(result.status).toBe("success");
    expect(mocks.syncConfirmedBookingToMicrosoftCalendar).toHaveBeenCalledWith(
      booking.id,
      {
        userId: owner.id,
        email: owner.email,
        reason: "invitation_removed",
      },
    );
  });
});
