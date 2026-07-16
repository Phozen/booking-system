import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queueReminders: vi.fn(),
  processQueue: vi.fn(),
  getHealth: vi.fn(),
}));

vi.mock("@/lib/email/reminders", () => ({
  queueDueBookingReminders: mocks.queueReminders,
}));
vi.mock("@/lib/email", () => ({
  processQueuedEmailNotifications: mocks.processQueue,
}));
vi.mock("@/lib/email/health", () => ({
  getEmailQueueHealth: mocks.getHealth,
}));

import { GET } from "@/app/api/cron/email/run/route";

describe("automated email cycle route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    mocks.queueReminders.mockResolvedValue({ queued: 1, skipped: 0 });
    mocks.processQueue.mockResolvedValue({
      processed: 1,
      sent: 1,
      failed: 0,
      retried: 0,
      skipped: 0,
      message: "Processed 1 queued email.",
    });
    mocks.getHealth.mockResolvedValue({
      checkedAt: new Date(0).toISOString(),
      overdueQueued: 0,
      staleSending: 0,
      failed: 0,
      exhaustedQueued: 0,
      oldestDueAt: null,
      healthy: true,
    });
  });

  it("rejects unauthenticated scheduler calls without side effects", async () => {
    const response = await GET(
      new Request("https://qbook.example.com/api/cron/email/run"),
    );

    expect(response.status).toBe(401);
    expect(mocks.queueReminders).not.toHaveBeenCalled();
    expect(mocks.processQueue).not.toHaveBeenCalled();
  });

  it("queues idempotent reminders before claiming and processing email", async () => {
    const response = await GET(
      new Request("https://qbook.example.com/api/cron/email/run", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.queueReminders).toHaveBeenCalledOnce();
    expect(mocks.processQueue).toHaveBeenCalledWith(100);
    expect(mocks.queueReminders.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.processQueue.mock.invocationCallOrder[0],
    );
    expect(body.health.healthy).toBe(true);
  });

  it("returns a recoverable failure when reminder queueing fails", async () => {
    mocks.queueReminders.mockRejectedValue(new Error("database unavailable"));
    const response = await GET(
      new Request("https://qbook.example.com/api/cron/email/run", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(500);
    expect(mocks.processQueue).not.toHaveBeenCalled();
  });

  it("returns 500 when the queue claim fails", async () => {
    mocks.processQueue.mockRejectedValue(new Error("claim failed"));

    const response = await GET(
      new Request("https://qbook.example.com/api/cron/email/run", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(500);
    expect(mocks.getHealth).not.toHaveBeenCalled();
  });

  it("returns 503 when queue health needs operator recovery", async () => {
    mocks.getHealth.mockResolvedValue({
      checkedAt: new Date(0).toISOString(),
      overdueQueued: 2,
      staleSending: 0,
      failed: 1,
      exhaustedQueued: 0,
      oldestDueAt: new Date(0).toISOString(),
      healthy: false,
    });

    const response = await GET(
      new Request("https://qbook.example.com/api/cron/email/run", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("Email queue requires operator recovery.");
  });
});
