import { describe, expect, it, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  checkBookingAvailability: vi.fn(),
  getAppSettings: vi.fn(),
  getEffectiveApprovalRequired: vi.fn(),
  createAuditLogSafely: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  syncConfirmedBookingToMicrosoftCalendar: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
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

vi.mock("@/lib/integrations/microsoft-365-calendar/sync", () => ({
  cancelMicrosoftCalendarEventForBooking: vi.fn(),
  syncConfirmedBookingToMicrosoftCalendar:
    mocks.syncConfirmedBookingToMicrosoftCalendar,
}));

const { createBookingAction } = await import("@/lib/bookings/actions");
const { renderEmailTemplate } = await import("@/lib/email/templates");

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "employee@example.com",
};
const profile = {
  id: user.id,
  email: user.email,
  role: "employee",
  status: "active",
};
const facility = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Board Room",
  slug: "board-room",
  requiresApproval: false,
};
const confirmedBooking = {
  id: "33333333-3333-4333-8333-333333333333",
  facility_id: facility.id,
  user_id: user.id,
  title: "Planning Session",
  description: "Quarterly planning",
  attendee_count: 4,
  catering_required: false,
  catering_type: null,
  catering_pax: null,
  catering_serving_time: null,
  catering_dietary_notes: null,
  catering_notes: null,
  status: "confirmed",
  starts_at: "2037-01-01T01:00:00.000Z",
  ends_at: "2037-01-01T02:00:00.000Z",
  approval_required: false,
};

function createForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    facilityId: facility.id,
    date: "2037-01-01",
    startTime: "01:00",
    endTime: "02:00",
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

function createActionMocks({
  approvalRequired = false,
  booking = confirmedBooking,
}: {
  approvalRequired?: boolean;
  booking?: typeof confirmedBooking;
} = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: booking, error: null });
  const userSupabase = { rpc };
  const emailQuery = {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
  const adminSupabase = {
    from: vi.fn((table: string) => {
      if (table === "email_notifications") {
        return emailQuery;
      }

      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }),
  };

  mocks.requireUser.mockResolvedValue({ user, profile });
  mocks.createClient.mockResolvedValue(userSupabase);
  mocks.createAdminClient.mockReturnValue(adminSupabase);
  mocks.getAppSettings.mockResolvedValue({ defaultTimezone: "UTC" });
  mocks.getEffectiveApprovalRequired.mockReturnValue(approvalRequired);
  mocks.checkBookingAvailability.mockResolvedValue({
    available: true,
    message: "Available",
    facility: { ...facility, requiresApproval: approvalRequired },
  });
  mocks.syncConfirmedBookingToMicrosoftCalendar.mockResolvedValue({
    status: "skipped",
  });

  return { rpc, emailQuery };
}

describe("booking confirmation email queueing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queues booking_confirmation for confirmed employee bookings using the authenticated email", async () => {
    const { emailQuery } = createActionMocks();

    await expect(
      createBookingAction({ status: "idle", message: "" }, createForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(emailQuery.insert).toHaveBeenCalledWith({
      type: "booking_confirmation",
      status: "queued",
      recipient_email: user.email,
      recipient_user_id: user.id,
      subject: "Booking confirmed: Planning Session",
      body: expect.stringContaining("Board Room"),
      template_name: "booking_confirmation",
      template_data: {
        bookingId: confirmedBooking.id,
        title: confirmedBooking.title,
        facilityName: facility.name,
        attendeeCount: 4,
        startsAt: confirmedBooking.starts_at,
        endsAt: confirmedBooking.ends_at,
        status: "confirmed",
      },
      related_booking_id: confirmedBooking.id,
      idempotency_key: `booking-confirmation:${confirmedBooking.id}:${user.email}`,
    });
  });

  it("does not queue booking_confirmation for pending approval-required bookings", async () => {
    const pendingBooking = {
      ...confirmedBooking,
      status: "pending",
      approval_required: true,
    };
    const { emailQuery } = createActionMocks({
      approvalRequired: true,
      booking: pendingBooking,
    });

    await expect(
      createBookingAction({ status: "idle", message: "" }, createForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(emailQuery.insert).not.toHaveBeenCalled();
  });

  it("does not introduce TEST_EMAIL_TO or a hardcoded recipient path", async () => {
    const { emailQuery } = createActionMocks();

    await expect(
      createBookingAction({ status: "idle", message: "" }, createForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    const [inserted] = emailQuery.insert.mock.calls[0];
    expect(inserted.recipient_email).toBe(user.email);
    expect(JSON.stringify(inserted)).not.toContain("TEST_EMAIL_TO");
  });
});

describe("booking confirmation email template", () => {
  it("renders booking details including attendee count and booking link", () => {
    const rendered = renderEmailTemplate({
      type: "booking_confirmation",
      recipientEmail: user.email,
      subject: "Booking confirmed: Planning Session",
      body: "Your booking has been confirmed.",
      appUrl: "https://booking.example.com",
      templateData: {
        bookingId: confirmedBooking.id,
        title: "Planning Session",
        facilityName: "Board Room",
        startsAt: "2037-01-01T01:00:00.000Z",
        endsAt: "2037-01-01T02:00:00.000Z",
        attendeeCount: 4,
        status: "confirmed",
      },
    });

    expect(rendered.subject).toBe("Booking confirmed: Planning Session");
    expect(rendered.text).toContain("Booking title: Planning Session");
    expect(rendered.text).toContain("Facility: Board Room");
    expect(rendered.text).toContain("Date:");
    expect(rendered.text).toContain("Start time:");
    expect(rendered.text).toContain("End time:");
    expect(rendered.text).toContain("Attendee count: 4");
    expect(rendered.text).toContain("Status: confirmed");
    expect(rendered.text).toContain(
      `https://booking.example.com/bookings/${confirmedBooking.id}`,
    );
    expect(rendered.html).toContain("Attendee count");
    expect(rendered.html).toContain("4");
  });
});
