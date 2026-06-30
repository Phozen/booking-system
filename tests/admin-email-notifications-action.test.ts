import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createAdminClient: vi.fn(),
  createAuditLogSafely: vi.fn(),
  processQueuedEmailNotifications: vi.fn(),
  queueDueBookingReminders: vi.fn(),
  retryFailedEmailNotifications: vi.fn(),
  revalidatePath: vi.fn(),
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

vi.mock("@/lib/audit/log", () => ({
  createAuditLogSafely: mocks.createAuditLogSafely,
}));

vi.mock("@/lib/email", () => ({
  processQueuedEmailNotifications: mocks.processQueuedEmailNotifications,
  retryFailedEmailNotifications: mocks.retryFailedEmailNotifications,
}));

vi.mock("@/lib/email/reminders", () => ({
  queueDueBookingReminders: mocks.queueDueBookingReminders,
}));

vi.mock("@/lib/settings/queries", () => ({
  getAppSettings: vi.fn(),
}));

const {
  processQueuedEmailNotificationsAction,
  queueDueBookingRemindersAction,
} = await import("@/lib/admin/email-notifications/actions");

describe("admin email notification actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "admin@example.com",
      },
    });
    mocks.createAdminClient.mockReturnValue({ client: "admin" });
    mocks.processQueuedEmailNotifications.mockResolvedValue({
      processed: 2,
      sent: 1,
      failed: 0,
      retried: 1,
      skipped: 0,
      message: "Processed 2 queued emails.",
    });
    mocks.queueDueBookingReminders.mockResolvedValue({
      queued: 2,
      skipped: 1,
    });
  });

  it("keeps manual admin processing wired to the safer queue processor", async () => {
    const result = await processQueuedEmailNotificationsAction();

    expect(mocks.createAdminClient).toHaveBeenCalled();
    expect(mocks.processQueuedEmailNotifications).toHaveBeenCalledWith({
      client: "admin",
    });
    expect(result).toEqual({
      status: "success",
      message:
        "Processed 2 queued emails. Sent: 1. Failed: 0. Retried: 1. Skipped: 0.",
    });
    expect(mocks.createAuditLogSafely).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/email-notifications");
  });

  it("keeps manual reminder queueing wired to the shared reminder helper", async () => {
    const result = await queueDueBookingRemindersAction();

    expect(mocks.createAdminClient).toHaveBeenCalled();
    expect(mocks.queueDueBookingReminders).toHaveBeenCalledWith({
      client: "admin",
    });
    expect(result).toEqual({
      status: "success",
      message: "Queued 2 due reminders. Skipped 1.",
    });
    expect(mocks.createAuditLogSafely).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/email-notifications");
  });
});
