import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createAdminClient: vi.fn(),
  checkBookingAvailability: vi.fn(),
  getAppSettings: vi.fn(),
  getEffectiveApprovalRequired: vi.fn(),
  createAuditLogSafely: vi.fn(),
  revalidatePath: vi.fn(),
  processEmailNotificationNow: vi.fn(),
  syncConfirmedBookingToMicrosoftCalendar: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/bookings/availability", () => ({
  checkBookingAvailability: mocks.checkBookingAvailability,
}));

vi.mock("@/lib/settings/queries", () => ({
  getAppSettings: mocks.getAppSettings,
  getEffectiveApprovalRequired: mocks.getEffectiveApprovalRequired,
}));

vi.mock("@/lib/audit/log", () => ({
  createAuditLogSafely: mocks.createAuditLogSafely,
}));

vi.mock("@/lib/email/queue", () => ({
  processEmailNotificationNow: mocks.processEmailNotificationNow,
}));

vi.mock("@/lib/integrations/microsoft-365-calendar/sync", () => ({
  cancelMicrosoftCalendarEventForBooking: vi.fn(),
  syncConfirmedBookingToMicrosoftCalendar:
    mocks.syncConfirmedBookingToMicrosoftCalendar,
}));

const { adminCreateBookingAction } = await import("@/lib/admin/bookings/actions");

type RpcError = { code?: string; message: string } | null;

const adminUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@example.com",
};
const superAdminUser = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "super@example.com",
};
const targetProfile = {
  id: "33333333-3333-4333-8333-333333333333",
  email: "employee@example.com",
  full_name: "Employee User",
  status: "active",
};
const facility = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "Board Room",
  requiresApproval: false,
};
const createdBooking = {
  id: "55555555-5555-4555-8555-555555555555",
  facility_id: facility.id,
  user_id: targetProfile.id,
  title: "Planning Session",
  status: "confirmed",
  attendee_count: 4,
  starts_at: "2037-01-01T10:00:00.000Z",
  ends_at: "2037-01-01T11:00:00.000Z",
  approval_required: false,
  cancellation_reason: null,
  cancelled_at: null,
};

function createForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    targetUserId: targetProfile.id,
    facilityId: facility.id,
    date: "2037-01-01",
    startTime: "10:00",
    endTime: "11:00",
    title: "Planning Session",
    description: "Quarterly planning",
    attendeeCount: "4",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function createSupabaseMock({
  profile = targetProfile,
  rpcError = null,
  rpcData = createdBooking,
}: {
  profile?: typeof targetProfile | null;
  rpcError?: RpcError;
  rpcData?: typeof createdBooking | null;
} = {}) {
  const fromTables: string[] = [];
  const rpc = vi.fn().mockResolvedValue({ data: rpcData, error: rpcError });

  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
  };

  const emailQuery = {
    maybeSingle: vi.fn().mockResolvedValue({
      data: { id: "66666666-6666-4666-8666-666666666666" },
      error: null,
    }),
    select: vi.fn(),
    insert: vi.fn(),
  };
  emailQuery.insert.mockReturnValue(emailQuery);
  emailQuery.select.mockReturnValue(emailQuery);

  const fallbackQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  };

  const supabase = {
    rpc,
    from: vi.fn((table: string) => {
      fromTables.push(table);
      if (table === "profiles") return profileQuery;
      if (table === "email_notifications") return emailQuery;
      return fallbackQuery;
    }),
  };

  return { supabase, rpc, fromTables, emailQuery };
}

function setupAction({
  actor = adminUser,
  profile = targetProfile,
  approvalRequired = false,
  rpcError = null,
  rpcData = createdBooking,
}: {
  actor?: typeof adminUser | null;
  profile?: typeof targetProfile | null;
  approvalRequired?: boolean;
  rpcError?: RpcError;
  rpcData?: typeof createdBooking | null;
} = {}) {
  const supabaseMock = createSupabaseMock({ profile, rpcError, rpcData });

  mocks.requireAdmin.mockResolvedValue({ user: actor });
  mocks.createAdminClient.mockReturnValue(supabaseMock.supabase);
  mocks.getAppSettings.mockResolvedValue({ defaultTimezone: "UTC" });
  mocks.syncConfirmedBookingToMicrosoftCalendar.mockResolvedValue({
    status: "skipped",
  });
  mocks.processEmailNotificationNow.mockResolvedValue({
    processed: 1,
    sent: 1,
    failed: 0,
    retried: 0,
    skipped: 0,
    message: "Processed booking confirmation email notification.",
  });
  mocks.checkBookingAvailability.mockResolvedValue({
    available: true,
    message: "Available",
    facility: { ...facility, requiresApproval: approvalRequired },
  });
  mocks.getEffectiveApprovalRequired.mockReturnValue(approvalRequired);

  return supabaseMock;
}

describe("adminCreateBookingAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows an admin to create a booking for an active employee through admin_create_booking", async () => {
    const { rpc } = setupAction();

    const result = await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm(),
    );

    expect(result.status).toBe("success");
    expect(rpc).toHaveBeenCalledWith("admin_create_booking", {
      p_actor_user_id: adminUser.id,
      p_target_user_id: targetProfile.id,
      p_facility_id: facility.id,
      p_title: "Planning Session",
      p_description: "Quarterly planning",
      p_attendee_count: 4,
      p_starts_at: "2037-01-01T10:00:00.000Z",
      p_ends_at: "2037-01-01T11:00:00.000Z",
      p_approval_required: false,
      p_catering_required: false,
      p_catering_type: null,
      p_catering_pax: null,
      p_catering_serving_time: null,
      p_catering_dietary_notes: null,
      p_catering_notes: null,
    });
  });

  it("allows a super admin actor returned by requireAdmin", async () => {
    const { rpc } = setupAction({ actor: superAdminUser });

    const result = await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm(),
    );

    expect(result.status).toBe("success");
    expect(rpc).toHaveBeenCalledWith(
      "admin_create_booking",
      expect.objectContaining({ p_actor_user_id: superAdminUser.id }),
    );
  });

  it("rejects disabled target users before calling the RPC", async () => {
    const { rpc } = setupAction({
      profile: { ...targetProfile, status: "disabled" },
    });

    const result = await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm(),
    );

    expect(result).toEqual({
      status: "error",
      message: "Only active users can own admin-created bookings.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    [
      "conflicting slot",
      { code: "23P01", message: "conflicting key value violates exclusion constraint" },
      "This time slot is no longer available. Please choose another time.",
    ],
    [
      "blocked period",
      { code: "P0001", message: "Facility is blocked for the selected time." },
      "This facility is unavailable during the selected time due to a blocked period.",
    ],
    [
      "maintenance closure",
      {
        code: "P0001",
        message: "Facility is under maintenance for the selected time.",
      },
      "This facility is under maintenance during the selected time.",
    ],
    [
      "capacity",
      { code: "P0001", message: "Attendee count exceeds facility capacity." },
      "Attendee count exceeds the facility capacity.",
    ],
  ])("maps %s RPC failures to friendly messages", async (_name, rpcError, message) => {
    setupAction({ rpcError, rpcData: null });

    const result = await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm(),
    );

    expect(result).toEqual({ status: "error", message });
    expect(mocks.createAuditLogSafely).not.toHaveBeenCalled();
    expect(mocks.syncConfirmedBookingToMicrosoftCalendar).not.toHaveBeenCalled();
  });

  it("does not let a non-admin path reach the admin create RPC", async () => {
    const { rpc } = setupAction({ actor: null });

    const result = await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm(),
    );

    expect(result).toEqual({
      status: "error",
      message: "You must be signed in as an admin.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sources p_actor_user_id from requireAdmin and ignores form input", async () => {
    const { rpc } = setupAction();

    await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm({ actorUserId: "99999999-9999-4999-8999-999999999999" }),
    );

    expect(rpc).toHaveBeenCalledWith(
      "admin_create_booking",
      expect.objectContaining({ p_actor_user_id: adminUser.id }),
    );
    expect(rpc).not.toHaveBeenCalledWith(
      "admin_create_booking",
      expect.objectContaining({
        p_actor_user_id: "99999999-9999-4999-8999-999999999999",
      }),
    );
  });

  it("does not insert booking_approvals in TypeScript because the RPC owns approval rows", async () => {
    const pendingBooking = {
      ...createdBooking,
      status: "pending",
      approval_required: true,
    };
    const { fromTables } = setupAction({
      approvalRequired: true,
      rpcData: pendingBooking,
    });

    const result = await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm(),
    );

    expect(result.status).toBe("success");
    expect(fromTables).not.toContain("booking_approvals");
  });

  it("runs audit, email, calendar, and revalidation only after successful confirmed creation", async () => {
    const { emailQuery } = setupAction();

    const result = await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm(),
    );

    expect(result.status).toBe("success");
    expect(mocks.createAuditLogSafely).toHaveBeenCalledOnce();
    expect(emailQuery.insert).toHaveBeenCalledWith({
      type: "booking_confirmation",
      status: "queued",
      recipient_email: targetProfile.email,
      recipient_user_id: targetProfile.id,
      subject: "Booking confirmed: Planning Session",
      body: "Your booking for Board Room has been created by an admin and confirmed.",
      template_name: "booking_confirmation",
      template_data: {
        bookingId: createdBooking.id,
        title: createdBooking.title,
        facilityName: facility.name,
        attendeeCount: 4,
        startsAt: createdBooking.starts_at,
        endsAt: createdBooking.ends_at,
        status: createdBooking.status,
      },
      related_booking_id: createdBooking.id,
      idempotency_key: `booking-confirmation:${createdBooking.id}:${targetProfile.email}`,
    });
    expect(mocks.processEmailNotificationNow).toHaveBeenCalledWith(
      "66666666-6666-4666-8666-666666666666",
      expect.any(Object),
    );
    expect(mocks.syncConfirmedBookingToMicrosoftCalendar).toHaveBeenCalledWith(
      createdBooking.id,
      {
        userId: adminUser.id,
        email: adminUser.email,
      },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/bookings");
  });

  it("skips audit, email, calendar, and revalidation after failed RPC creation", async () => {
    const { emailQuery } = setupAction({
      rpcError: { code: "P0001", message: "Only active admins can create bookings for another user." },
      rpcData: null,
    });

    const result = await adminCreateBookingAction(
      { status: "idle", message: "" },
      createForm(),
    );

    expect(result).toEqual({
      status: "error",
      message: "Only active admins can create bookings for another user.",
    });
    expect(mocks.createAuditLogSafely).not.toHaveBeenCalled();
    expect(emailQuery.insert).not.toHaveBeenCalled();
    expect(mocks.syncConfirmedBookingToMicrosoftCalendar).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
