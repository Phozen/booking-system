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
  processEmailNotificationNow: vi.fn(),
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

vi.mock("@/lib/email/queue", () => ({
  processEmailNotificationNow: mocks.processEmailNotificationNow,
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
  full_name: "Employee User",
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

function createActionMocks({
  approvalRequired = false,
  booking = confirmedBooking,
  admins = [],
}: {
  approvalRequired?: boolean;
  booking?: Record<string, unknown>;
  admins?: { id: string; email: string; full_name: string | null }[];
} = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: booking, error: null });
  const userSupabase = { rpc };
  let lastEmailInsert: unknown;
  const emailQuery = {
    maybeSingle: vi.fn().mockResolvedValue({
      data: { id: "44444444-4444-4444-8444-444444444444" },
      error: null,
    }),
    select: vi.fn(),
    insert: vi.fn(),
  };
  emailQuery.insert.mockImplementation((payload: unknown) => {
    lastEmailInsert = payload;
    return emailQuery;
  });
  emailQuery.select.mockImplementation(() => {
    if (Array.isArray(lastEmailInsert)) {
      return Promise.resolve({
        data: lastEmailInsert.map((_, index) => ({
          id: `55555555-5555-4555-8555-55555555555${index}`,
        })),
        error: null,
      });
    }

    return emailQuery;
  });
  const profilesQuery = {
    select: vi.fn(),
    in: vi.fn(),
    eq: vi.fn().mockResolvedValue({ data: admins, error: null }),
  };
  profilesQuery.select.mockReturnValue(profilesQuery);
  profilesQuery.in.mockReturnValue(profilesQuery);
  const departmentsQuery = {
    select: vi.fn(),
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  departmentsQuery.select.mockReturnValue(departmentsQuery);
  const adminSupabase = {
    from: vi.fn((table: string) => {
      if (table === "email_notifications") {
        return emailQuery;
      }

      if (table === "profiles") {
        return profilesQuery;
      }

      if (table === "booking_departments") {
        return departmentsQuery;
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
  mocks.processEmailNotificationNow.mockResolvedValue({
    processed: 1,
    sent: 1,
    failed: 0,
    retried: 0,
    skipped: 0,
    message: "Processed booking confirmation email notification.",
  });

  return { rpc, emailQuery, profilesQuery };
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
        departments: [],
      },
      related_booking_id: confirmedBooking.id,
      idempotency_key: `booking-confirmation:${confirmedBooking.id}:${user.email}`,
    });
    expect(mocks.processEmailNotificationNow).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-444444444444",
      expect.any(Object),
    );
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
    expect(mocks.processEmailNotificationNow).not.toHaveBeenCalled();
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

  it("queues catering requests to active admins when catering is required", async () => {
    const cateringBooking = {
      ...confirmedBooking,
      catering_required: true,
      catering_type: "vip_catering",
      catering_pax: 8,
      catering_serving_time: "before_meeting",
      catering_dietary_notes: "Halal",
      catering_notes: "Serve before arrival",
    };
    const { emailQuery, profilesQuery } = createActionMocks({
      booking: cateringBooking,
      admins: [
        {
          id: "66666666-6666-4666-8666-666666666666",
          email: "admin@example.com",
          full_name: "Admin User",
        },
      ],
    });

    await expect(
      createBookingAction(
        { status: "idle", message: "" },
        createForm({
          cateringRequired: "yes",
          cateringType: "vip_catering",
          cateringPax: "8",
          cateringServingTime: "before_meeting",
          cateringDietaryNotes: "Halal",
          cateringNotes: "Serve before arrival",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(profilesQuery.in).toHaveBeenCalledWith("role", [
      "admin",
      "super_admin",
    ]);
    const cateringInsert = emailQuery.insert.mock.calls.find(([payload]) =>
      Array.isArray(payload),
    )?.[0] as Record<string, unknown>[] | undefined;
    expect(cateringInsert).toEqual([
      expect.objectContaining({
        type: "booking_catering_request",
        status: "queued",
        recipient_email: "admin@example.com",
        recipient_user_id: "66666666-6666-4666-8666-666666666666",
        subject: "Catering requested: Planning Session",
        template_name: "booking_catering_request",
        related_booking_id: confirmedBooking.id,
        idempotency_key: `booking-catering-request:${confirmedBooking.id}:admin@example.com`,
      }),
    ]);
    expect(cateringInsert?.[0].template_data).toEqual(
      expect.objectContaining({
        bookingId: confirmedBooking.id,
        requesterEmail: user.email,
        requesterName: "Employee User",
        cateringType: "vip_catering",
        cateringPax: 8,
        cateringServingTime: "before_meeting",
        cateringDietaryNotes: "Halal",
        cateringNotes: "Serve before arrival",
      }),
    );
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
    expect(rendered.text).toContain("Facility: Board Room");
    expect(rendered.text).toContain("Date:");
    expect(rendered.text).toContain("Time:");
    expect(rendered.text).not.toContain("Start time:");
    expect(rendered.text).not.toContain("End time:");
    expect(rendered.text).toContain("Attendees: 4");
    expect(rendered.text).toContain("Status: confirmed");
    expect(rendered.text).toContain(
      `https://booking.example.com/bookings/${confirmedBooking.id}`,
    );
    expect(rendered.html).toContain('role="article"');
    expect(rendered.html).toContain("View booking");
    expect(rendered.html).toContain("Attendees");
    expect(rendered.html).toContain("4");
  });

  it("renders an immutable department snapshot when it was queued with the booking email", () => {
    const rendered = renderEmailTemplate({
      type: "booking_confirmation",
      recipientEmail: user.email,
      subject: "Booking confirmed: Planning Session",
      body: "Your booking has been confirmed.",
      appUrl: "https://booking.example.com",
      templateData: {
        bookingId: confirmedBooking.id,
        title: "Planning Session",
        departments: [
          { name: "Human Resources", email: "hr@example.com" },
          { name: "Information Technology", email: "it@example.com" },
        ],
      },
    });

    expect(rendered.text).toContain("Departments");
    expect(rendered.text).toContain("Human Resources (hr@example.com)");
    expect(rendered.text).toContain("Information Technology (it@example.com)");
  });

  it("renders catering request details for admins", () => {
    const rendered = renderEmailTemplate({
      type: "booking_catering_request",
      recipientEmail: "admin@example.com",
      subject: "Catering requested: Planning Session",
      body: "A booking was created with catering requested.",
      appUrl: "https://booking.example.com",
      templateData: {
        bookingId: confirmedBooking.id,
        title: "Planning Session",
        facilityName: "Board Room",
        startsAt: "2037-01-01T01:00:00.000Z",
        endsAt: "2037-01-01T02:00:00.000Z",
        requesterName: "Employee User",
        cateringType: "vip_catering",
        cateringPax: 8,
        cateringServingTime: "before_meeting",
        cateringDietaryNotes: "Halal",
        cateringNotes: "Serve before arrival",
      },
    });

    expect(rendered.subject).toBe("Catering requested: Planning Session");
    expect(rendered.text).toContain("Requester: Employee User");
    expect(rendered.text).toContain(
      "Catering type: VIP / management meeting catering",
    );
    expect(rendered.text).toContain("Catering pax: 8");
    expect(rendered.text).toContain("Serving time: Before meeting");
    expect(rendered.text).toContain("Dietary notes: Halal");
  });
});
