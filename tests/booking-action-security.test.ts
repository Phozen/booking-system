import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
  createAuditLogSafely: vi.fn(),
  processEmailNotificationNow: vi.fn(),
  syncConfirmedBookingToMicrosoftCalendar: vi.fn(),
  cancelMicrosoftCalendarEventForBooking: vi.fn(),
  revalidatePath: vi.fn(),
  checkBookingAvailability: vi.fn(),
  getAppSettings: vi.fn(),
  getEffectiveApprovalRequired: vi.fn(),
  createAppNotification: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/guards", () => ({
  requireAdmin: mocks.requireAdmin,
  requireUser: mocks.requireUser,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/bookings/availability", () => ({
  checkBookingAvailability: mocks.checkBookingAvailability,
}));
vi.mock("@/lib/settings/queries", () => ({
  getAppSettings: mocks.getAppSettings,
  getEffectiveApprovalRequired: mocks.getEffectiveApprovalRequired,
}));
vi.mock("@/lib/notifications/app-notifications", () => ({
  createAppNotification: mocks.createAppNotification,
}));
vi.mock("@/lib/audit/log", () => ({
  createAuditLogSafely: mocks.createAuditLogSafely,
}));
vi.mock("@/lib/email/queue", () => ({
  processEmailNotificationNow: mocks.processEmailNotificationNow,
}));
vi.mock("@/lib/integrations/microsoft-365-calendar/sync", () => ({
  syncConfirmedBookingToMicrosoftCalendar:
    mocks.syncConfirmedBookingToMicrosoftCalendar,
  cancelMicrosoftCalendarEventForBooking:
    mocks.cancelMicrosoftCalendarEventForBooking,
}));

const {
  adminCancelBookingAction,
  approveBookingAction,
  markBookingCheckedInAction,
  rejectBookingAction,
} = await import("@/lib/admin/bookings/actions");
const { updateBookingCateringAction } = await import(
  "@/lib/bookings/catering/actions"
);

const admin = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@example.com",
};
const owner = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "owner@example.com",
};
const outsider = {
  id: "33333333-3333-4333-8333-333333333333",
  email: "outsider@example.com",
};
const bookingId = "44444444-4444-4444-8444-444444444444";

const pendingBooking = {
  id: bookingId,
  facility_id: "55555555-5555-4555-8555-555555555555",
  user_id: owner.id,
  title: "Security review",
  status: "pending",
  starts_at: "2038-01-01T10:00:00.000Z",
  ends_at: "2038-01-01T11:00:00.000Z",
  approval_required: true,
  cancellation_reason: null,
  cancelled_at: null,
  usage_status: "not_tracked",
  checked_in_at: null,
  checked_in_by: null,
  no_show_marked_at: null,
  no_show_marked_by: null,
  facilities: { name: "Board Room", level: "1" },
  profiles: { email: owner.email, full_name: "Owner" },
  booking_approvals: [
    {
      id: "66666666-6666-4666-8666-666666666666",
      status: "pending",
      remarks: null,
    },
  ],
};

function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function queryResult(data: unknown, error: unknown = null) {
  const query: Record<string, unknown> = {};
  for (const method of ["select", "eq", "neq", "in", "lt", "gt", "limit"]) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn().mockResolvedValue({ data, error });
  query.insert = vi.fn().mockResolvedValue({ data: null, error: null });
  query.then = (
    resolve: (value: { data: unknown[]; error: null }) => unknown,
  ) => Promise.resolve({ data: [], error: null }).then(resolve);
  return query;
}

function setupAdminAction({
  booking = pendingBooking,
  rpcError = { code: "P0001", message: "guarded mutation failed" },
}: {
  booking?: typeof pendingBooking;
  rpcError?: { code: string; message: string } | null;
} = {}) {
  const fromTables: string[] = [];
  const adminClient = {
    from: vi.fn((table: string) => {
      fromTables.push(table);
      return queryResult(table === "bookings" ? booking : null);
    }),
  };
  const rpc = vi.fn().mockResolvedValue({ data: null, error: rpcError });

  mocks.requireAdmin.mockResolvedValue({ user: admin });
  mocks.createAdminClient.mockReturnValue(adminClient);
  mocks.createClient.mockResolvedValue({ rpc });

  return { rpc, fromTables };
}

describe("guarded booking admin actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["approve", approveBookingAction, "approved"],
    ["reject", rejectBookingAction, "rejected"],
  ])(
    "%s calls the atomic review RPC and stops all side effects when it fails",
    async (_label, action, decision) => {
      const { rpc, fromTables } = setupAdminAction();

      const result = await action(
        bookingId,
        { status: "idle", message: "" },
        form({ remarks: "Reviewed" }),
      );

      expect(result.status).toBe("error");
      expect(rpc).toHaveBeenCalledWith("review_booking_approval", {
        p_booking_id: bookingId,
        p_decision: decision,
        p_remarks: "Reviewed",
      });
      expect(fromTables).not.toContain("audit_logs");
      expect(fromTables).not.toContain("email_notifications");
      expect(mocks.processEmailNotificationNow).not.toHaveBeenCalled();
      expect(mocks.syncConfirmedBookingToMicrosoftCalendar).not.toHaveBeenCalled();
      expect(mocks.cancelMicrosoftCalendarEventForBooking).not.toHaveBeenCalled();
    },
  );

  it("admin cancellation calls only the guarded cancellation RPC on failure", async () => {
    const { rpc, fromTables } = setupAdminAction();

    const result = await adminCancelBookingAction(
      bookingId,
      { status: "idle", message: "" },
      form({ remarks: "Operational closure" }),
    );

    expect(result.status).toBe("error");
    expect(rpc).toHaveBeenCalledWith("cancel_booking_as_admin", {
      p_booking_id: bookingId,
      p_reason: "Operational closure",
    });
    expect(fromTables).not.toContain("audit_logs");
    expect(fromTables).not.toContain("email_notifications");
  });

  it("usage tracking calls only the guarded usage RPC on failure", async () => {
    const { rpc, fromTables } = setupAdminAction({
      booking: { ...pendingBooking, status: "confirmed" },
    });

    const result = await markBookingCheckedInAction(
      bookingId,
      { status: "idle", message: "" },
      form(),
    );

    expect(result.status).toBe("error");
    expect(rpc).toHaveBeenCalledWith("update_booking_usage_as_admin", {
      p_booking_id: bookingId,
      p_usage_status: "checked_in",
    });
    expect(fromTables).not.toContain("audit_logs");
  });
});

function setupCateringAction({
  actor = owner,
  role = "employee",
}: {
  actor?: typeof owner;
  role?: "employee" | "admin" | "super_admin";
} = {}) {
  const booking = {
    id: bookingId,
    user_id: owner.id,
    title: "Security review",
    status: "confirmed",
    catering_required: false,
    catering_type: null,
    catering_pax: null,
    catering_serving_time: null,
    catering_dietary_notes: null,
    catering_notes: null,
  };
  const adminClient = { from: vi.fn(() => queryResult(booking)) };
  const rpc = vi.fn().mockResolvedValue({
    data: null,
    error: { code: "P0001", message: "guarded mutation failed" },
  });

  mocks.requireUser.mockResolvedValue({
    user: actor,
    profile: { role, status: "active" },
  });
  mocks.createAdminClient.mockReturnValue(adminClient);
  mocks.createClient.mockResolvedValue({ rpc });

  return { rpc };
}

function cateringForm() {
  return form({
    required: "true",
    type: "buffet",
    pax: "10",
    servingTime: "10:30",
    dietaryNotes: "None",
    notes: "Water",
  });
}

describe("guarded booking catering action", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["owner", owner, "employee" as const],
    ["admin", admin, "admin" as const],
  ])("allows the %s boundary to reach the catering RPC", async (_label, actor, role) => {
    const { rpc } = setupCateringAction({ actor, role });

    await updateBookingCateringAction(
      bookingId,
      { status: "idle", message: "" },
      cateringForm(),
    );

    expect(rpc).toHaveBeenCalledWith(
      "update_booking_catering",
      expect.objectContaining({ p_booking_id: bookingId }),
    );
  });

  it("rejects an unrelated employee before any mutation RPC", async () => {
    const { rpc } = setupCateringAction({ actor: outsider, role: "employee" });

    const result = await updateBookingCateringAction(
      bookingId,
      { status: "idle", message: "" },
      cateringForm(),
    );

    expect(result).toEqual({
      status: "error",
      message: "You do not have permission to edit catering details.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
