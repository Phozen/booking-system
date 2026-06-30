import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAppSettings: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/settings/queries", () => ({
  getAppSettings: mocks.getAppSettings,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

const { queueDueBookingReminders } = await import("@/lib/email/reminders");

const booking = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Planning",
  user_id: "22222222-2222-4222-8222-222222222222",
  starts_at: "2035-01-01T10:00:00.000Z",
  ends_at: "2035-01-01T11:00:00.000Z",
  profiles: {
    email: "employee@example.com",
    full_name: "Employee",
  },
  facilities: {
    name: "Board Room",
    level: "1",
  },
};

function createSupabaseMock({
  duplicateOnInsert = false,
}: { duplicateOnInsert?: boolean } = {}) {
  const inserted: unknown[] = [];
  const from = vi.fn((table: string) => {
    if (table === "bookings") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [booking], error: null }),
      };
    }

    if (table === "user_notification_preferences") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }

    if (table === "email_notifications") {
      return {
        insert: vi.fn((payload: unknown) => {
          if (duplicateOnInsert) {
            return Promise.resolve({
              data: null,
              error: { code: "23505", message: "duplicate idempotency key" },
            });
          }

          inserted.push(payload);
          return Promise.resolve({ data: null, error: null });
        }),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return { from, inserted };
}

describe("queueDueBookingReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAppSettings.mockResolvedValue({ reminderOffsetsMinutes: [60] });
  });

  it("queues due reminders with an idempotency key", async () => {
    const supabase = createSupabaseMock();

    const result = await queueDueBookingReminders(
      supabase as never,
      new Date("2035-01-01T09:30:00.000Z"),
    );

    expect(result).toEqual({ queued: 1, skipped: 0 });
    expect(supabase.inserted).toHaveLength(1);
    expect(supabase.inserted[0]).toMatchObject({
      type: "booking_reminder",
      status: "queued",
      recipient_email: "employee@example.com",
      idempotency_key:
        "booking-reminder:11111111-1111-4111-8111-111111111111:employee@example.com:60",
    });
  });

  it("treats duplicate idempotency key inserts as skipped", async () => {
    const supabase = createSupabaseMock({ duplicateOnInsert: true });

    const result = await queueDueBookingReminders(
      supabase as never,
      new Date("2035-01-01T09:30:00.000Z"),
    );

    expect(result).toEqual({ queued: 0, skipped: 1 });
  });

  it("creates an admin client when called without one", async () => {
    const supabase = createSupabaseMock();
    mocks.createAdminClient.mockReturnValue(supabase);

    await queueDueBookingReminders(undefined, new Date("2035-01-01T09:30:00.000Z"));

    expect(mocks.createAdminClient).toHaveBeenCalled();
  });
});
